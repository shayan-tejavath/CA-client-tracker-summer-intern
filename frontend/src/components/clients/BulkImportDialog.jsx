import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";

import api from "../../services/api";

const BulkImportDialog = ({ open, onOpenChange, onImported }) => {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);

  const resetDialog = () => {
    setFile(null);
    setPreviewData(null);
    setResult(null);
    setDragging(false);
    setPreviewLoading(false);
    setImportLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/clients/download-template", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "client-import-template.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to download the template."
      );
    }
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    const allowed = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!allowed.includes(selectedFile.type)) {
      toast.error("Please upload an Excel or CSV file.");
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB.");
      return false;
    }

    return true;
  };

  const previewFile = async (selectedFile) => {
    try {
      setPreviewLoading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data } = await api.post("/clients/preview-import", formData);
      setPreviewData(data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to preview the file."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFile = async (selectedFile) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    await previewFile(selectedFile);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    await handleFile(droppedFile);
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const importClients = async () => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    try {
      setImportLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/clients/import", formData);
      setResult(data);

      window.dispatchEvent(new Event("clients-imported"));

      if (typeof onImported === "function") {
        onImported(data);
      }

      toast.success(
        `${data.importedCount ?? 0} clients imported successfully.`
      );

      const skippedServices = data.createdClients
        ?.flatMap((client) => client.invalidServiceNames || [])
        .filter(Boolean);

      if (skippedServices?.length) {
        const uniqueNames = [...new Set(skippedServices)];
        toast.warn(
          `Skipped invalid services: ${uniqueNames.join(", ")}`
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed.");
    } finally {
      setImportLoading(false);
    }
  };

  const previewRows = previewData?.preview || [];
  const totalRows = previewData?.totalRows ?? previewRows.length;
  const validRows = previewRows.filter(
    (row) => !row.validationErrors || row.validationErrors.length === 0
  ).length;
  const invalidRows = Math.max(0, totalRows - validRows);

  const previewErrors = previewRows.flatMap((row) =>
    (row.validationErrors || []).map(
      (message) => `Row ${row.row ?? "?"}: ${message}`
    )
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetDialog();
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Clients</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to create multiple clients at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.995 }}
                onDrop={onDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  dragging ? "border-violet-500 bg-violet-50" : "border-slate-300"
                }`}
              >
                <Upload className="mx-auto mb-4 text-violet-600" size={42} />
                <h3 className="font-semibold text-lg">Drag & Drop Excel File</h3>
                <p className="text-muted-foreground mt-2">CSV / XLS / XLSX</p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button type="button" onClick={onBrowseClick}>
                    Browse File
                  </Button>

                  <Button type="button" variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </motion.div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <FileSpreadsheet className="text-green-600" size={36} />
                        <div>
                          <h4 className="font-semibold">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={resetDialog}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {previewLoading && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-violet-600" size={42} />
                  <p className="text-muted-foreground">Reading Excel file...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Summary</CardTitle>
                <CardDescription>
                  Valid and invalid rows detected from the uploaded file
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border p-4">
                    <h2 className="text-3xl font-bold">{totalRows}</h2>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <h2 className="text-3xl font-bold text-green-600">
                      {validRows}
                    </h2>
                    <p className="text-sm text-muted-foreground">Valid Rows</p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <h2 className="text-3xl font-bold text-red-600">
                      {invalidRows}
                    </h2>
                    <p className="text-sm text-muted-foreground">Invalid Rows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {previewErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <strong>Validation Errors</strong>
                  <ul className="list-disc ml-5 space-y-1">
                    {previewErrors.slice(0, 10).map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                  {previewErrors.length > 10 && (
                    <p>+ {previewErrors.length - 10} more errors...</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {previewRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  First 10 rows from the uploaded file
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="max-h-[350px] overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>PAN</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {previewRows.slice(0, 10).map((row, index) => {
                        const services =
                          row.assignedServices ||
                          row.services ||
                          row.assignedServiceNames ||
                          [];

                        const rowHasErrors =
                          Array.isArray(row.validationErrors) &&
                          row.validationErrors.length > 0;

                        return (
                          <TableRow key={index}>
                            <TableCell>{row.clientName || "—"}</TableCell>
                            <TableCell>{row.pan || "—"}</TableCell>
                            <TableCell>{row.gstin || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {services.slice(0, 3).map((service, serviceIndex) => (
                                  <Badge key={`${service}-${serviceIndex}`} variant="secondary">
                                    {service}
                                  </Badge>
                                ))}
                                {services.length > 3 && <Badge>+{services.length - 3}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={rowHasErrors ? "destructive" : "default"}>
                                {rowHasErrors ? "Invalid" : "Valid"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-green-500">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle2 className="text-green-600" size={70} />
                    <h2 className="text-2xl font-bold">Import Completed</h2>
                    <p>
                      Imported{" "}
                      <strong>{result.importedCount ?? 0}</strong> clients
                      successfully.
                    </p>

                    {typeof result.failedCount === "number" &&
                      result.failedCount > 0 && (
                        <p className="text-red-500">
                          Failed: {result.failedCount}
                        </p>
                      )}

                    {typeof result.skippedCount === "number" &&
                      result.skippedCount > 0 && (
                        <p className="text-amber-500">
                          Skipped: {result.skippedCount}
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetDialog();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>

          <Button
            type="button"
            disabled={!file || importLoading}
            onClick={importClients}
          >
            {importLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Clients
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
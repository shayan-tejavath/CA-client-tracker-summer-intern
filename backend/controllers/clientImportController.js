import path from "path";
import XLSX from "xlsx";

import {
  importClientsFromExcel,
  previewImport,
  getClientImportTemplate,
} from "../services/clientImportService.js";

/* ===========================================================
   IMPORT CLIENTS
=========================================================== */

export const bulkImportClients = async (
  req,
  res,
  next
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required.",
      });
    }

    const assignedBy =
      req.user?.name ||
      req.user?.email ||
      "Bulk Import";

    const result =
      await importClientsFromExcel(
        req.file.path,
        assignedBy
      );

    return res.status(200).json({
      success: true,
      message: "Clients imported successfully.",
      importedCount: result.successCount,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   PREVIEW IMPORT
=========================================================== */

export const previewClientImport =
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file is required.",
        });
      }

      const preview =
        await previewImport(
          req.file.path
        );

      res.status(200).json({
        success: true,

        totalRows:
          preview.length,

        preview,
      });
    } catch (error) {
      next(error);
    }
  };

/* ===========================================================
   DOWNLOAD TEMPLATE
=========================================================== */

export const downloadClientTemplate =
  async (req, res, next) => {
    try {
      const workbook =
        XLSX.utils.book_new();

      const headers =
        getClientImportTemplate();

      const worksheet =
        XLSX.utils.aoa_to_sheet([
          headers,
        ]);

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Clients"
      );

      const fileName =
        "client-import-template.xlsx";

      const filePath = path.join(
        process.cwd(),
        "uploads",
        fileName
      );

      XLSX.writeFile(
        workbook,
        filePath
      );

      return res.download(
        filePath,
        fileName
      );
    } catch (error) {
      next(error);
    }
  };
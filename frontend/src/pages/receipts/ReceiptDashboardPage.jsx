import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getReceipts, deleteReceipt } from "../../services/receiptService.js";
import "../../styles/invoices.css";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const ReceiptDashboardPage = () => {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.receipts)
            ? data.receipts
            : [];
      setReceipts(list);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load receipts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const uniqueClients = useMemo(() => {
    return [
      ...new Set(
        receipts
          .map((receipt) => receipt.client?.clientName || receipt.clientName)
          .filter(Boolean)
      ),
    ];
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const now = new Date();

    return receipts.filter((receipt) => {
      const receiptDate = receipt.receiptDate ? new Date(receipt.receiptDate) : null;
      const clientName = receipt.client?.clientName || receipt.clientName || "";
      const receiptNo = receipt.receiptNo || "";
      const paymentMode = receipt.paymentMode || "";
      const billingEntity = receipt.billingEntity || "";

      const isClientMatch = !clientFilter || clientName === clientFilter;

      let isDateMatch = true;
      if (dateFilter === "month" && receiptDate) {
        isDateMatch =
          receiptDate.getMonth() === now.getMonth() &&
          receiptDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === "quarter" && receiptDate) {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const receiptQuarter = Math.floor(receiptDate.getMonth() / 3);
        isDateMatch =
          currentQuarter === receiptQuarter &&
          receiptDate.getFullYear() === now.getFullYear();
      }

      const isSearchMatch =
        !normalized ||
        [receiptNo, clientName, paymentMode, billingEntity]
          .some((value) => String(value || "").toLowerCase().includes(normalized));

      return isClientMatch && isDateMatch && isSearchMatch;
    });
  }, [receipts, query, clientFilter, dateFilter]);

  const exportCsv = () => {
    const header = [
      "Receipt No",
      "Date",
      "Billing Entity",
      "Client",
      "Payment Mode",
      "Amount",
      "Status",
    ];

    const rows = filteredReceipts.map((r) => [
      r.receiptNo || "",
      formatDate(r.receiptDate),
      r.billingEntity || "",
      r.client?.clientName || r.clientName || "",
      r.paymentMode || "",
      r.totalAmount ?? r.receivedAmount ?? 0,
      r.status || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "receipts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (receiptId) => {
    const confirmDelete = window.confirm("Delete this receipt?");
    if (!confirmDelete) return;

    try {
      await deleteReceipt(receiptId);
      toast.success("Receipt deleted successfully.");
      loadReceipts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete receipt.");
    }
  };

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-breadcrumb">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            ←
          </button>
          <h1>Receipts</h1>
        </div>

        <section className="invoice-filter-panel">
          <div className="invoice-field">
            <label>Date</label>
            <div className="invoice-control-shell">
              <CalendarDays size={18} />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="invoice-field invoice-field--wide">
            <label>Search</label>
            <div className="invoice-control-shell">
              <Search size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search receipt no., client, payment mode"
              />
            </div>
          </div>

          <div className="invoice-field">
            <label>Client</label>
            <div className="invoice-control-shell">
              <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                <option value="">Select...</option>
                {uniqueClients.map((clientName) => (
                  <option key={clientName} value={clientName}>
                    {clientName}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="invoice-filter-actions">
            <button
              type="button"
              className="invoice-icon-button"
              aria-label="Refresh"
              onClick={loadReceipts}
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              className="invoice-icon-button"
              aria-label="New receipt"
              onClick={() => navigate("/dashboard/receipts/new")}
            >
              <Plus size={20} />
            </button>
          </div>
        </section>

        <section className="invoice-table-panel">
          <div className="invoice-list-actions">
            <button type="button" className="invoice-secondary-button" onClick={exportCsv}>
              <Download size={16} />
              Export
            </button>
            <button
              type="button"
              className="invoice-primary-button"
              onClick={() => navigate("/dashboard/receipts/new")}
            >
              <Plus size={16} />
              New
            </button>
          </div>

          {loading ? (
            <div className="invoice-empty-row" style={{ padding: 24, textAlign: "center" }}>
              Loading receipts...
            </div>
          ) : (
            <div className="invoice-table-scroll">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Select all receipts"
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length === filteredReceipts.length
                        }
                        onChange={(e) => {
                          setSelectedIds(e.target.checked ? filteredReceipts.map((r) => r._id) : []);
                        }}
                      />
                    </th>
                    <th>Date</th>
                    <th>Billing Entity</th>
                    <th>Receipt No.</th>
                    <th>Client</th>
                    <th>Payment Mode</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(receipt._id)}
                          onChange={(e) => {
                            setSelectedIds((current) =>
                              e.target.checked
                                ? [...current, receipt._id]
                                : current.filter((id) => id !== receipt._id)
                            );
                          }}
                        />
                      </td>
                      <td>{formatDate(receipt.receiptDate)}</td>
                      <td>{receipt.billingEntity || "Primary"}</td>
                      <td>
                        <button
                          type="button"
                          className="invoice-link"
                          onClick={() => navigate(`/dashboard/receipts/${receipt._id}`)}
                        >
                          {receipt.receiptNo}
                        </button>
                      </td>
                      <td>{receipt.client?.clientName || "—"}</td>
                      <td>{receipt.paymentMode || "—"}</td>
                      <td>{formatCurrency(receipt.totalAmount ?? receipt.receivedAmount)}</td>
                      <td>
                        <span
                          className={`invoice-status invoice-status--${String(
                            receipt.status || "completed"
                          ).toLowerCase()}`}
                        >
                          {receipt.status || "Completed"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="invoice-row-menu"
                          aria-label="Receipt actions"
                          onClick={() => handleDelete(receipt._id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!filteredReceipts.length && (
                    <tr>
                      <td colSpan="9" className="invoice-empty-row">
                        No receipts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ReceiptDashboardPage;
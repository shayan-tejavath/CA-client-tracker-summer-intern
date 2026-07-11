import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ReceiptText,
  Plus,
  BarChart3,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getEmployees } from "../../services/employeeService.js";
import { deleteExpense, exportExpenses, getExpenses } from "../../services/expenseService.js";
import "../../styles/expenses.css";

const initialFilters = {
  category: "",
  status: "",
  vendor: "",
  employee: "",
  paymentMode: "",
  dateFrom: "",
  dateTo: "",
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const employeeName = (employee) => employee?.name || employee?.email || "Unassigned";

const SummaryCard = ({ label, value, tone, icon: Icon, isCurrency = false }) => (
  <article className={`expense-summary-card expense-summary-card--${tone}`}>
    <div>
      <p>{label}</p>
      <strong>{isCurrency ? formatCurrency(value) : Number(value || 0).toLocaleString("en-IN")}</strong>
    </div>
    <span className="expense-summary-icon"><Icon size={21} /></span>
  </article>
);

const ExpenseManagementPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, pending: 0, approved: 0, paid: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ sortBy: "expenseDate", sortOrder: "desc" });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedExpense, setSelectedExpense] = useState(null);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const buildExportParams = () => ({
    search: search.trim() || undefined,
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    format: exportFormat,
  });

  const handleExpenseExport = async () => {
    try {
      setExportLoading(true);
      const blob = await exportExpenses(buildExportParams());
      const extension = exportFormat === "csv" ? "csv" : exportFormat === "pdf" ? "pdf" : "xlsx";
      downloadBlob(blob, `expenses-export.${extension}`);
      toast.success("Expense export downloaded successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to export expenses.");
    } finally {
      setExportLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(Array.isArray(response) ? response : response?.data || response?.employees || []);
    } catch {
      setEmployees([]);
    }
  };

  const loadExpenses = async (page = pagination.page) => {
    try {
      setLoading(true);
      const response = await getExpenses({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
        ...sort,
      });
      setExpenses(response?.data || []);
      setPagination(response?.pagination || { page, limit: 10, total: 0, totalPages: 0 });
      setSummary(response?.summary || { totalAmount: 0, pending: 0, approved: 0, paid: 0 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => loadExpenses(1), 300);
    return () => window.clearTimeout(timer);
  }, [search, filters, sort]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => {
    setSearch("");
    setFilters(initialFilters);
    setSort({ sortBy: "expenseDate", sortOrder: "desc" });
  };

  const toggleSort = (sortBy) => {
    setSort((current) => ({
      sortBy,
      sortOrder: current.sortBy === sortBy && current.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense ${expense.expenseNumber}?`)) return;
    try {
      await deleteExpense(expense._id);
      toast.success("Expense deleted successfully.");
      setSelectedExpense(null);
      loadExpenses(expenses.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete expense.");
    }
  };

  const SortHeader = ({ label, field }) => (
    <th>
      <button type="button" className="expense-sort-button" onClick={() => toggleSort(field)}>
        {label}
        <ArrowDownUp size={13} className={sort.sortBy === field ? "is-active" : ""} />
      </button>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="expenses-page">
        <header className="expenses-header">
          <div>
            <p className="expenses-eyebrow">Finance overview</p>
            <h1>Expense Management</h1>
            <span>Track business spending, approvals, and reimbursements in one place.</span>
          </div>
          <div className="expenses-header-actions"><button type="button" className="expense-dashboard-button" onClick={() => navigate("/dashboard/expenses/dashboard")}><BarChart3 size={17} /> Dashboard</button><button type="button" className="expense-new-button" onClick={() => navigate("/dashboard/expenses/new")}><Plus size={17} /> New expense</button><button type="button" className="expenses-refresh" onClick={() => loadExpenses()} disabled={loading}><RefreshCw size={16} className={loading ? "expense-spin" : ""} /> Refresh</button></div>
        </header>

        <section className="expense-summary-grid" aria-label="Expense summary">
          <SummaryCard label="Total Expenses" value={summary.totalAmount} tone="blue" icon={WalletCards} isCurrency />
          <SummaryCard label="Pending" value={summary.pending} tone="amber" icon={ReceiptText} />
          <SummaryCard label="Approved" value={summary.approved} tone="violet" icon={ReceiptText} />
          <SummaryCard label="Paid" value={summary.paid} tone="green" icon={ReceiptText} />
        </section>

        <section className="expenses-workspace">
          <div className="expense-toolbar">
            <label className="expense-search">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expense no., vendor, category..." />
            </label>
            <div className="expense-export-controls">
              <select className="expense-export-select" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)} aria-label="Export format">
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
              <button type="button" className="expense-filter-button" onClick={handleExpenseExport} disabled={exportLoading}>
                {exportLoading ? "Exporting..." : "Export"}
              </button>
            </div>
            <button type="button" className={showFilters ? "expense-filter-button is-open" : "expense-filter-button"} onClick={() => setShowFilters((open) => !open)}>
              <Filter size={16} /> Advanced filters
              <ChevronDown size={15} />
            </button>
          </div>

          {showFilters && (
            <div className="expense-filters">
              <label>Category<input value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} placeholder="e.g. Travel" /></label>
              <label>Status<select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Paid</option></select></label>
              <label>Vendor<input value={filters.vendor} onChange={(event) => updateFilter("vendor", event.target.value)} placeholder="Vendor name" /></label>
              <label>Employee<select value={filters.employee} onChange={(event) => updateFilter("employee", event.target.value)}><option value="">All employees</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)}</option>)}</select></label>
              <label>Payment mode<select value={filters.paymentMode} onChange={(event) => updateFilter("paymentMode", event.target.value)}><option value="">All modes</option><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>Card</option><option>Net Banking</option></select></label>
              <label>Date from<div className="expense-date-input"><CalendarDays size={15} /><input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></div></label>
              <label>Date to<div className="expense-date-input"><CalendarDays size={15} /><input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></div></label>
              <button type="button" className="expense-clear-button" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          <div className="expense-table-wrap">
            <table className="expense-table">
              <thead><tr><SortHeader label="Expense Number" field="expenseNumber" /><SortHeader label="Vendor" field="vendor" /><SortHeader label="Category" field="category" /><th>Employee</th><SortHeader label="Date" field="expenseDate" /><SortHeader label="Amount" field="totalAmount" /><SortHeader label="Status" field="status" /><th aria-label="Actions" /></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="8" className="expense-empty">Loading expenses…</td></tr> : expenses.length === 0 ? <tr><td colSpan="8" className="expense-empty">No expenses match your filters.</td></tr> : expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td data-label="Expense Number"><button type="button" className="expense-number" onClick={() => navigate(`/dashboard/expenses/${expense._id}`)}>{expense.expenseNumber}</button></td>
                    <td data-label="Vendor"><strong>{expense.vendor || "—"}</strong></td>
                    <td data-label="Category">{expense.category}</td>
                    <td data-label="Employee">{employeeName(expense.employee)}</td>
                    <td data-label="Date">{formatDate(expense.expenseDate)}</td>
                    <td data-label="Amount" className="expense-amount">{formatCurrency(expense.totalAmount)}</td>
                    <td data-label="Status"><span className={`expense-status expense-status--${String(expense.status).toLowerCase()}`}>{expense.status}</span></td>
                    <td data-label="Actions"><div className="expense-row-actions"><button type="button" onClick={() => navigate(`/dashboard/expenses/${expense._id}`)} aria-label="View expense"><Eye size={17} /></button><button type="button" className="expense-delete" onClick={() => handleDelete(expense)} aria-label="Delete expense"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="expense-pagination"><span>Showing {expenses.length ? (pagination.page - 1) * pagination.limit + 1 : 0}–{(pagination.page - 1) * pagination.limit + expenses.length} of {pagination.total} expenses</span><div><button type="button" onClick={() => loadExpenses(pagination.page - 1)} disabled={pagination.page <= 1}><ChevronLeft size={17} /> Previous</button><span className="expense-page-indicator">Page {pagination.page} of {pagination.totalPages || 1}</span><button type="button" onClick={() => loadExpenses(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}><span>Next</span><ChevronRight size={17} /></button></div></footer>
        </section>

        {selectedExpense && <div className="expense-modal-backdrop" role="presentation" onMouseDown={() => setSelectedExpense(null)}><section className="expense-detail-modal" role="dialog" aria-modal="true" aria-label="Expense details" onMouseDown={(event) => event.stopPropagation()}><header><div><p>Expense details</p><h2>{selectedExpense.expenseNumber}</h2></div><button type="button" onClick={() => setSelectedExpense(null)} aria-label="Close"><X size={20} /></button></header><div className="expense-detail-grid"><div><span>Vendor</span><strong>{selectedExpense.vendor || "—"}</strong></div><div><span>Category</span><strong>{selectedExpense.category}</strong></div><div><span>Employee</span><strong>{employeeName(selectedExpense.employee)}</strong></div><div><span>Payment mode</span><strong>{selectedExpense.paymentMode}</strong></div><div><span>Date</span><strong>{formatDate(selectedExpense.expenseDate)}</strong></div><div><span>Total amount</span><strong>{formatCurrency(selectedExpense.totalAmount)}</strong></div><div><span>GST</span><strong>{selectedExpense.gstPercentage || 0}% · {formatCurrency(selectedExpense.gstAmount)}</strong></div><div><span>Status</span><strong><span className={`expense-status expense-status--${String(selectedExpense.status).toLowerCase()}`}>{selectedExpense.status}</span></strong></div></div>{selectedExpense.remarks && <p className="expense-remarks">{selectedExpense.remarks}</p>}<footer><button type="button" className="expense-delete-modal" onClick={() => handleDelete(selectedExpense)}><Trash2 size={16} /> Delete expense</button></footer></section></div>}
      </div>
    </DashboardLayout>
  );
};

export default ExpenseManagementPage;

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  MoreVertical,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import "../../styles/invoices.css";

const billingEntities = [
  {
    id: "primary",
    name: "Primary",
    company: "Your Company",
    logoText: "YOUR LOGO",
    address: ["Billing address line 1", "City, State", "India"],
    mobile: "9998887770",
    email: "billing@yourcompany.com",
    gstin: "08ABCDE1234A1ZJ",
    bank: {
      upi: "your_upi@bank",
      pan: "AAPDP2468B",
      accountName: "Your Company",
      accountNumber: "682502409571",
      bankName: "ICICI Bank",
      ifsc: "ICIC0000000",
    },
  },
];

const paymentTerms = [
  { id: "NET 7", days: 7 },
  { id: "NET 15", days: 15 },
  { id: "NET 30", days: 30 },
];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatInputDate = (date) => date.toISOString().slice(0, 10);

const displayDate = (value) => {
  if (!value) return "";
  if (value.includes("-") && value.split("-")[0].length === 4) {
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  }
  return value;
};

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return formatInputDate(date);
};

const rowTotal = (row) => {
  const amount = Number(row.amount || 0);
  const discount = Number(row.discount || 0);
  const taxable = Math.max(amount - discount, 0);
  return taxable + (taxable * Number(row.gst || 0)) / 100;
};

const amountInWords = (amount) => `${formatCurrency(amount)} only.`;

const getEntity = (id) => billingEntities.find((entity) => entity.id === id) || billingEntities[0];

const IconButton = ({ label, children, ...props }) => (
  <button type="button" className="invoice-icon-button" aria-label={label} title={label} {...props}>
    {children}
  </button>
);

const StatusBadge = ({ status }) => (
  <span className={`invoice-status invoice-status--${String(status).toLowerCase()}`}>
    {status}
  </span>
);

const InvoicesList = ({ invoices, setInvoices, navigate }) => {
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (clientFilter && invoice.clientName !== clientFilter) return false;
      if (!normalized) return true;

      return [invoice.id, invoice.clientName, invoice.status]
        .some((value) => String(value || "").toLowerCase().includes(normalized));
    });
  }, [clientFilter, invoices, query]);

  const uniqueClients = useMemo(
    () => [...new Set(invoices.map((invoice) => invoice.clientName).filter(Boolean))],
    [invoices]
  );

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-breadcrumb">
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </button>
          <h1>Invoices</h1>
        </div>

        <section className="invoice-filter-panel">
          <div className="invoice-field">
            <label>Date</label>
            <div className="invoice-control-shell">
              <CalendarDays size={18} />
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search invoice no. or client"
              />
            </div>
          </div>

          <div className="invoice-field">
            <label>Client</label>
            <div className="invoice-control-shell">
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="">All clients</option>
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
            <IconButton label="Create invoice" onClick={() => navigate("/dashboard/invoices/new")}>
              <Plus size={20} />
            </IconButton>
            <IconButton label="Reset filters" onClick={() => { setQuery(""); setClientFilter(""); setDateFilter("all"); }}>
              <RefreshCw size={18} />
            </IconButton>
            <IconButton label="Apply filters">
              <Send size={18} />
            </IconButton>
          </div>
        </section>

        <section className="invoice-table-panel">
          <div className="invoice-list-actions">
            <button type="button" className="invoice-secondary-button" onClick={() => toast.info("Export is ready for the next integration step.")}>
              <Download size={16} />
              Export
            </button>
            <button type="button" className="invoice-primary-button" onClick={() => navigate("/dashboard/invoices/new")}>
              <Plus size={16} />
              New
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="invoice-empty-row" style={{ padding: "24px", textAlign: "center" }}>
              <p>No invoices created yet.</p>
              <button type="button" className="invoice-primary-button" onClick={() => navigate("/dashboard/invoices/new")}>
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="invoice-table-scroll">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Select all invoices" /></th>
                    <th>Date</th>
                    <th>Billing Entity</th>
                    <th>Invoice No.</th>
                    <th>Client</th>
                    <th>Due Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><input type="checkbox" aria-label={`Select invoice ${invoice.id}`} /></td>
                      <td>{invoice.date}</td>
                      <td>{getEntity(invoice.entityId).name}</td>
                      <td>
                        <button type="button" className="invoice-link" onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}>
                          {invoice.id}
                        </button>
                      </td>
                      <td>{invoice.clientName || "Client"}</td>
                      <td>{invoice.dueDate}</td>
                      <td>{formatCurrency(invoice.amount)}</td>
                      <td><StatusBadge status={invoice.status} /></td>
                      <td>
                        <button type="button" className="invoice-row-menu" aria-label={`Invoice ${invoice.id} actions`}>
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

const NewInvoice = ({ invoices, setInvoices, navigate, location }) => {
  const today = formatInputDate(new Date());
  const editInvoice = location.state?.invoiceToEdit;
  const [entityId, setEntityId] = useState(editInvoice?.entityId || "primary");
  const [clientName, setClientName] = useState(editInvoice?.clientName || "");
  const [invoiceNo, setInvoiceNo] = useState(editInvoice?.id || "");
  const [invoiceDate, setInvoiceDate] = useState(editInvoice?.date || today);
  const [paymentTerm, setPaymentTerm] = useState(editInvoice?.paymentTerm || "NET 15");
  const [rows, setRows] = useState(editInvoice?.rows || []);
  const [expensePickerOpen, setExpensePickerOpen] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  useEffect(() => {
    if (editInvoice) {
      setEntityId(editInvoice.entityId || "primary");
      setClientName(editInvoice.clientName || "");
      setInvoiceNo(editInvoice.id || "");
      setInvoiceDate(editInvoice.date || today);
      setPaymentTerm(editInvoice.paymentTerm || "NET 15");
      setRows(editInvoice.rows || []);
    }
  }, [editInvoice, today]);

  const term = paymentTerms.find((item) => item.id === paymentTerm) || paymentTerms[1];
  const dueDate = addDays(invoiceDate, term.days);
  const currentExpenses = clientName
    ? [
        { id: "expense-1", date: "Today", name: "Reimbursement", amount: 500 },
      ]
    : [];

  const totals = useMemo(() => {
    const selectedRows = rows.filter((row) => row.selected || row.manual);
    const subtotal = selectedRows.reduce((sum, row) => sum + Math.max(Number(row.amount || 0) - Number(row.discount || 0), 0), 0);
    const tax = selectedRows.reduce((sum, row) => {
      const taxable = Math.max(Number(row.amount || 0) - Number(row.discount || 0), 0);
      return sum + (taxable * Number(row.gst || 0)) / 100;
    }, 0);
    const total = subtotal + tax;

    return {
      subtotal,
      discount: selectedRows.reduce((sum, row) => sum + Number(row.discount || 0), 0),
      tax,
      roundOff: Math.round(total) - total,
      total: Math.round(total),
    };
  }, [rows]);

  const handleClientChange = (value) => {
    setClientName(value);
    if (value) {
      setRows([
        {
          id: `pending-${Date.now()}`,
          type: "task",
          title: "Pending service item",
          sac: "",
          description: "Add your actual service work or package here.",
          amount: "",
          discount: "",
          gst: 18,
          selected: true,
        },
      ]);
    } else {
      setRows([]);
    }
    setSelectedExpenses([]);
  };

  const updateRow = (rowId, key, value) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const addManualItem = () => {
    setRows((current) => [
      ...current,
      {
        id: `manual-${Date.now()}`,
        type: "manual",
        title: "",
        sac: "",
        description: "",
        amount: "",
        discount: "",
        gst: 18,
        selected: true,
        manual: true,
      },
    ]);
  };

  const addExpenses = () => {
    const expensesToAdd = currentExpenses
      .filter((expense) => selectedExpenses.includes(expense.id))
      .map((expense) => ({
        id: `expense-${expense.id}`,
        type: "expense",
        title: expense.name,
        sac: "",
        description: `Reimbursement for ${expense.date}`,
        amount: expense.amount,
        discount: 0,
        gst: 0,
        selected: true,
      }));

    setRows((current) => [...current, ...expensesToAdd]);
    setExpensePickerOpen(false);
    setSelectedExpenses([]);
  };

  const removeRow = (rowId) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
  };

  const saveInvoice = () => {
    if (!clientName) {
      toast.error("Enter or select a client before saving the invoice.");
      return;
    }

    const id = invoiceNo.trim() || `INV-${String(invoices.length + 1).padStart(3, "0")}`;
    const invoiceData = {
      id,
      date: invoiceDate,
      dueDate,
      entityId,
      clientName,
      paymentTerm,
      amount: Math.round(totals.total),
      status: "Draft",
      rows: rows.filter((row) => row.selected || row.manual),
    };

    if (editInvoice) {
      setInvoices((current) => current.map((invoice) => (invoice.id === editInvoice.id ? invoiceData : invoice)));
      toast.success("Invoice updated. Share and print actions are ready.");
    } else {
      setInvoices((current) => [invoiceData, ...current]);
      toast.success("Invoice draft created. Share and print actions are now available.");
    }

    navigate(`/dashboard/invoices/${id}`);
  };

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-breadcrumb">
          <button type="button" onClick={() => navigate("/dashboard/invoices")} aria-label="Back to invoices">
            <ArrowLeft size={20} />
          </button>
          <button type="button" className="invoice-crumb-link" onClick={() => navigate("/dashboard/invoices")}>
            Invoices
          </button>
          <span>/</span>
          <h1>{editInvoice ? "Edit Invoice" : "New Invoice"}</h1>
        </div>

        <section className="invoice-form-panel">
          <div className="invoice-form-grid">
            <div className="invoice-field">
              <label>Billing Entity <span>*</span></label>
              <div className="invoice-control-shell">
                <select value={entityId} onChange={(event) => setEntityId(event.target.value)}>
                  {billingEntities.map((entity) => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Date <span>*</span></label>
              <div className="invoice-control-shell">
                <CalendarDays size={18} />
                <input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Client <span>*</span></label>
              <div className="invoice-control-shell">
                <input
                  value={clientName}
                  onChange={(event) => handleClientChange(event.target.value)}
                  placeholder="Type or select a client"
                  list="client-list"
                />
                <datalist id="client-list">
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.clientName} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="invoice-field">
              <label>Invoice No. <span>*</span></label>
              <input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} placeholder="INV-001" />
            </div>

            <div className="invoice-field invoice-form-spacer" />

            <div className="invoice-field">
              <label>Payment Term <span>*</span></label>
              <div className="invoice-control-shell">
                <select value={paymentTerm} onChange={(event) => setPaymentTerm(event.target.value)}>
                  {paymentTerms.map((item) => (
                    <option key={item.id} value={item.id}>{item.id}</option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="invoice-field invoice-form-spacer" />

            <div className="invoice-field">
              <label>Due Date <span>*</span></label>
              <div className="invoice-control-shell invoice-control-shell--disabled">
                <CalendarDays size={18} />
                <input value={displayDate(dueDate)} readOnly />
              </div>
            </div>
          </div>

          <div className="invoice-items-heading">
            <h2>Invoice Items</h2>
            <div className="invoice-legend">
              <span><i className="legend-task" />Task</span>
              <span><i className="legend-expense" />Expense</span>
              <span><i className="legend-package" />Package</span>
            </div>
          </div>

          <div className="invoice-items-scroll">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th aria-label="Drag handle" />
                  <th>Particulars</th>
                  <th>Select</th>
                  <th>Amount (Rs.)</th>
                  <th>Discount (Rs.)</th>
                  <th>GST (%)</th>
                  <th>Total Amount (Rs.)</th>
                  <th aria-label="Remove item" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="invoice-empty-row">
                      Enter a client name to load pending items.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className={`invoice-item-row invoice-item-row--${row.type}`}>
                      <td className="invoice-drag">=</td>
                      <td>
                        <div className="invoice-item-title-line">
                          {row.manual ? (
                            <input value={row.title} onChange={(event) => updateRow(row.id, "title", event.target.value)} placeholder="Item" />
                          ) : (
                            <strong>{row.title}</strong>
                          )}
                          {row.status && <span className={`invoice-mini-status invoice-mini-status--${row.status.toLowerCase()}`}>{row.status}</span>}
                        </div>
                        <div className="invoice-item-subgrid">
                          {row.manual && (
                            <input value={row.sac || ""} onChange={(event) => updateRow(row.id, "sac", event.target.value)} placeholder="SAC" />
                          )}
                          <textarea value={row.description || ""} onChange={(event) => updateRow(row.id, "description", event.target.value)} placeholder="Description" />
                        </div>
                      </td>
                      <td>
                        <input type="checkbox" checked={Boolean(row.selected)} onChange={(event) => updateRow(row.id, "selected", event.target.checked)} aria-label={`Select ${row.title || "manual item"}`} />
                      </td>
                      <td>
                        <input type="number" value={row.amount} onChange={(event) => updateRow(row.id, "amount", event.target.value)} />
                      </td>
                      <td>
                        <input type="number" value={row.discount} onChange={(event) => updateRow(row.id, "discount", event.target.value)} />
                      </td>
                      <td>
                        <input type="number" value={row.gst} onChange={(event) => updateRow(row.id, "gst", event.target.value)} />
                      </td>
                      <td>
                        <input value={row.selected ? rowTotal(row).toFixed(2) : ""} readOnly />
                      </td>
                      <td>
                        {row.manual || row.type === "expense" ? (
                          <IconButton label="Remove item" onClick={() => removeRow(row.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="invoice-add-item-wrap">
            <button type="button" className="invoice-soft-button" onClick={addManualItem}>
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="invoice-bottom-grid">
            <div>
              {clientName && currentExpenses.length > 0 && (
                <div className="invoice-expense-callout">
                  <p>{currentExpenses.length} reimbursement entry is ready to add.</p>
                  <button type="button" className="invoice-soft-button" onClick={() => setExpensePickerOpen(true)}>
                    <Plus size={16} />
                    Add Expenses
                  </button>
                </div>
              )}
            </div>

            <TotalsPanel totals={totals} splitTax={getEntity(entityId).address.includes("India")} />
          </div>

          <div className="invoice-form-actions">
            <button type="button" className="invoice-secondary-button" onClick={() => navigate("/dashboard/invoices")}>
              Cancel
            </button>
            <button type="button" className="invoice-primary-button" onClick={saveInvoice}>
              <Check size={16} />
              Save Invoice
            </button>
          </div>
        </section>

        {expensePickerOpen && (
          <div className="invoice-modal-backdrop" role="presentation">
            <section className="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
              <div className="invoice-modal-header">
                <h2 id="expense-modal-title">Reimbursements</h2>
                <IconButton label="Close reimbursements" onClick={() => setExpensePickerOpen(false)}>
                  <X size={20} />
                </IconButton>
              </div>

              <table className="invoice-expense-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Select all expenses" /></th>
                    <th>Date</th>
                    <th>Expense</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <input type="checkbox" checked={selectedExpenses.includes(expense.id)} onChange={(event) => { setSelectedExpenses((current) => event.target.checked ? [...current, expense.id] : current.filter((id) => id !== expense.id)); }} aria-label={`Select ${expense.name}`} />
                      </td>
                      <td>{expense.date}</td>
                      <td>{expense.name}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-modal-actions">
                <button type="button" className="invoice-primary-button" onClick={addExpenses}>Add</button>
                <button type="button" className="invoice-secondary-button" onClick={() => setExpensePickerOpen(false)}>Cancel</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const TotalsPanel = ({ totals, splitTax }) => (
  <aside className="invoice-totals-panel">
    <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
    <div><span>Discount</span><strong>{formatCurrency(totals.discount)}</strong></div>
    {splitTax ? (
      <>
        <div><span>CGST</span><strong>{formatCurrency(totals.tax / 2)}</strong></div>
        <div><span>SGST</span><strong>{formatCurrency(totals.tax / 2)}</strong></div>
      </>
    ) : (
      <div><span>IGST</span><strong>{formatCurrency(totals.tax)}</strong></div>
    )}
    <div><span>Round Off</span><strong>{formatCurrency(totals.roundOff)}</strong></div>
    <div className="invoice-total-final"><span>Total Amount</span><strong>{formatCurrency(totals.total)}</strong></div>
  </aside>
);

const InvoiceView = ({ invoices, setInvoices, navigate, invoiceId }) => {
  const [shareOpen, setShareOpen] = useState(false);

  const invoice =
    invoices.find((item) => item.id === invoiceId) || {
      id: invoiceId || "INV-001",
      date: "Today",
      dueDate: "Today",
      entityId: "primary",
      clientName: "Client",
      rows: [],
      amount: 0,
      status: "Draft",
    };

  const entity = getEntity(invoice.entityId);
  const rows = invoice.rows || [];
  const subtotal = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const gst = rows.reduce((sum, row) => sum + (Number(row.amount || 0) * Number(row.gst || 0)) / 100, 0);
  const total = subtotal + gst;

  const notify = (message) => {
    toast.success(message);
    setShareOpen(false);
  };

  const handleDelete = () => {
    setInvoices((current) => current.filter((item) => item.id !== invoice.id));
    toast.info("Invoice removed from the list.");
    navigate("/dashboard/invoices");
  };

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-view-toolbar">
          <div className="invoice-breadcrumb">
            <button type="button" onClick={() => navigate("/dashboard/invoices")} aria-label="Back to invoices">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="invoice-crumb-link" onClick={() => navigate("/dashboard/invoices")}>
              Invoices
            </button>
            <span>/</span>
            <h1>#{invoice.id}</h1>
          </div>

          <div className="invoice-view-actions">
            <div className="invoice-share-wrap">
              <IconButton label="Share invoice" onClick={() => setShareOpen((current) => !current)}>
                <Share2 size={18} />
              </IconButton>
              {shareOpen && (
                <div className="invoice-share-menu">
                  <button type="button" onClick={() => notify("Invoice email queued for the client.")}>
                    <Mail size={16} />
                    Send Email
                  </button>
                  <button type="button" onClick={() => notify("Invoice WhatsApp message queued for the client.")}>
                    <MessageCircle size={16} />
                    Send WhatsApp
                  </button>
                  <button type="button" onClick={() => notify("PDF generation is ready for the next integration step.")}>
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="invoice-warn-button" onClick={() => navigate("/dashboard/invoices")}>Cancel</button>
            <button type="button" className="invoice-secondary-button" onClick={() => navigate("/dashboard/invoices/new", { state: { invoiceToEdit: invoice } })}>Edit</button>
            <button type="button" className="invoice-danger-button" onClick={handleDelete}>Delete</button>
            <button type="button" className="invoice-primary-button" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        <section className="invoice-document">
          <header className="invoice-doc-header">
            <div>
              <div className="invoice-logo-mark">
                <FileText size={52} />
                <span>{entity.logoText}</span>
              </div>
              <h2>{entity.company}</h2>
              {entity.address.map((line) => <p key={line}>{line}</p>)}
              <p>Mobile: {entity.mobile}</p>
              <p>Email: {entity.email}</p>
              <p className="invoice-gstin">GSTIN: {entity.gstin}</p>
            </div>
            <h2 className="invoice-doc-title">Tax Invoice</h2>
          </header>

          <section className="invoice-doc-client">
            <div>
              <p>To:</p>
              <strong>{invoice.clientName || "Client"}</strong>
              <p>Invoice will be populated from your connected client records.</p>
            </div>
            <dl>
              <div><dt>Invoice No.:</dt><dd>{invoice.id}</dd></div>
              <div><dt>Invoice Date:</dt><dd>{invoice.date}</dd></div>
              <div><dt>Due Date:</dt><dd>{invoice.dueDate}</dd></div>
            </dl>
          </section>

          <table className="invoice-doc-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>SAC</th>
                <th>Price</th>
                <th>GST (%)</th>
                <th>GST</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const tax = (Number(row.amount || 0) * Number(row.gst || 0)) / 100;
                return (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.sac}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>{row.gst}%</td>
                    <td>{formatCurrency(tax)}</td>
                    <td>{formatCurrency(Number(row.amount || 0) + tax)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <section className="invoice-doc-footer">
            <div>
              <p className="invoice-words">{amountInWords(total)}</p>
              <div className="invoice-qr-box">
                <div>
                  <p>Scan QR code to pay using any UPI app.</p>
                  <p>UPI ID</p>
                  <strong>mative@icici</strong>
                </div>
                <div className="invoice-fake-qr" aria-label="Payment QR code" />
              </div>

              <div className="invoice-bank-details">
                <p>Company Bank Details</p>
                <p>UPI ID: {entity.bank.upi}</p>
                <p>PAN Number: {entity.bank.pan}</p>
                <p>Account Name: {entity.bank.accountName}</p>
                <p>Account Number: {entity.bank.accountNumber}</p>
                <p>Bank Name: {entity.bank.bankName}</p>
                <p>IFS Code: {entity.bank.ifsc}</p>
              </div>
            </div>

            <div className="invoice-summary">
              <div><span>Subtotal:</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div><span>IGST:</span><strong>{formatCurrency(gst)}</strong></div>
              <div className="invoice-summary-total"><span>Total:</span><strong>{formatCurrency(total)}</strong></div>
              <div><span>Received:</span><strong>{formatCurrency(0)}</strong></div>
              <div><span>Balance:</span><strong>{formatCurrency(total)}</strong></div>
              <div><span>Current Ledger Balance:</span><strong>{formatCurrency(81939)}</strong></div>
              <div className="invoice-signature">
                <span>For {entity.company}</span>
              </div>
            </div>
          </section>
        </section>
      </div>
    </DashboardLayout>
  );
};

const InvoiceDashboardPage = () => {
  const [invoices, setInvoices] = useState([]);
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  if (path.endsWith("/new")) {
    return <NewInvoice invoices={invoices} setInvoices={setInvoices} navigate={navigate} location={location} />;
  }

  if (invoiceId) {
    return <InvoiceView invoices={invoices} setInvoices={setInvoices} navigate={navigate} invoiceId={invoiceId} />;
  }

  return <InvoicesList invoices={invoices} setInvoices={setInvoices} navigate={navigate} />;
};

export default InvoiceDashboardPage;

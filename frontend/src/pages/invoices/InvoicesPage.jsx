import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    company: "My Company",
    logoText: "YOUR LOGO",
    address: ["Navrangpura, Ahmedabad", "Gujarat"],
    mobile: "9998887770",
    email: "your_id@mail.com",
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
  {
    id: "secondary",
    name: "Secondary",
    company: "My Company - Advisory",
    logoText: "YOUR LOGO",
    address: ["Bodakdev, Ahmedabad", "Gujarat"],
    mobile: "9887766550",
    email: "billing@mail.com",
    gstin: "24ABCDE1234A1Z4",
    bank: {
      upi: "advisory@bank",
      pan: "AAPDP2468B",
      accountName: "Your Company Advisory",
      accountNumber: "652019304410",
      bankName: "HDFC Bank",
      ifsc: "HDFC0000000",
    },
  },
  {
    id: "amd",
    name: "AMD",
    company: "AMD Associates",
    logoText: "AMD",
    address: ["CG Road, Ahmedabad", "Gujarat"],
    mobile: "9797979797",
    email: "accounts@amd.test",
    gstin: "24AMDDE1234A1Z5",
    bank: {
      upi: "amd@upi",
      pan: "AMDPA2468B",
      accountName: "AMD Associates",
      accountNumber: "552244119876",
      bankName: "Axis Bank",
      ifsc: "UTIB0000000",
    },
  },
  {
    id: "amdd",
    name: "AMDD",
    company: "AMDD Tax Consultants",
    logoText: "AMDD",
    address: ["Satellite, Ahmedabad", "Gujarat"],
    mobile: "9090909090",
    email: "hello@amdd.test",
    gstin: "24AMDDD1234A1Z6",
    bank: {
      upi: "amdd@upi",
      pan: "AMDDP2468B",
      accountName: "AMDD Tax Consultants",
      accountNumber: "102938475610",
      bankName: "Kotak Mahindra Bank",
      ifsc: "KKBK0000000",
    },
  },
];

const clients = [
  {
    id: "anil",
    name: "Anil Sharma",
    code: "#A1344",
    group: "Rahul",
    address: [
      "B-10, B-Wing, Orchid Residency, Shastri Nagar",
      "B-10, B-Wing, Orchid Residency, Shastri Nagar",
      "Mumbai - 400050",
      "Maharashtra",
    ],
    mobile: "9024570899",
    email: "practiveteam@gmail.com",
  },
  {
    id: "acp",
    name: "ACP & SK Ltd",
    code: "#12/7",
    group: "",
    address: ["Science City Road", "Ahmedabad - 380060", "Gujarat"],
    mobile: "9099988877",
    email: "finance@acpsk.test",
  },
  {
    id: "auto-prime",
    name: "Auto Prime",
    code: "#AP45",
    group: "Rahul",
    address: ["Industrial Area", "Vadodara - 390001", "Gujarat"],
    mobile: "9888881111",
    email: "billing@autoprime.test",
  },
  {
    id: "mohan",
    name: "Mohan Singh",
    code: "#M07",
    group: "Rahul",
    address: ["Civil Lines", "Jaipur - 302006", "Rajasthan"],
    mobile: "9870011100",
    email: "mohan@example.test",
  },
  {
    id: "madhav",
    name: "Madhav Dave",
    code: "#MD20",
    group: "",
    address: ["Paldi", "Ahmedabad - 380007", "Gujarat"],
    mobile: "9000090000",
    email: "madhav@example.test",
  },
];

const unbilledItems = {
  anil: [
    { id: "task-1", type: "task", title: "Accounting (2011-12)", status: "Hold", amount: 0, discount: 0, gst: 18, selected: false },
    { id: "task-2", type: "task", title: "Abcd Loan (Apr-Sep - 2018)", status: "Pending", amount: 0, discount: 0, gst: 18, selected: false },
    { id: "task-3", type: "task", title: "ITR (2024-25)", status: "Pending", amount: 1000, discount: 0, gst: 18, selected: false },
    { id: "task-4", type: "task", title: "GSTR 3B (Apr - 2025)", status: "Completed", amount: 1000, discount: 0, gst: 18, selected: true },
    { id: "pkg-1", type: "package", title: "TDS Package (2024-25)", status: "", amount: 12, discount: 0, gst: 0, selected: false },
    { id: "pkg-2", type: "package", title: "Composition Package (2024-25)", status: "", amount: 122, discount: 0, gst: 18, selected: false },
    { id: "pkg-3", type: "package", title: "GST Package (2025-26)", status: "", amount: 12000, discount: 0, gst: 18, selected: false },
    { id: "pkg-4", type: "package", title: "TDS Package (2025-26)", status: "", amount: 12, discount: 0, gst: 0, selected: false },
  ],
  acp: [
    { id: "acp-1", type: "package", title: "GST Package (2024-25)", status: "Completed", amount: 12000, discount: 0, gst: 18, selected: true },
    { id: "acp-2", type: "task", title: "TDS Return Q4", status: "Pending", amount: 5000, discount: 0, gst: 18, selected: false },
  ],
  "auto-prime": [
    { id: "auto-1", type: "package", title: "GST Package (2023-24)", status: "Completed", amount: 12000, discount: 0, gst: 18, selected: true },
    { id: "auto-2", type: "task", title: "Ledger Review", status: "Pending", amount: 1298, discount: 0, gst: 18, selected: false },
  ],
  mohan: [
    { id: "mohan-1", type: "task", title: "Annual Filing", status: "Completed", amount: 1298, discount: 0, gst: 18, selected: true },
    { id: "mohan-2", type: "expense", title: "Government fees reimbursement", status: "", amount: 531, discount: 0, gst: 0, selected: false },
  ],
  madhav: [
    { id: "madhav-1", type: "task", title: "Income Tax Consultation", status: "Completed", amount: 1298, discount: 0, gst: 18, selected: true },
  ],
};

const unbilledExpenses = {
  anil: [
    { id: "exp-1", date: "28-06-2024", name: "Stationary", amount: 750 },
    { id: "exp-2", date: "13-11-2024", name: "Tax paid", amount: 1000 },
    { id: "exp-3", date: "27-01-2025", name: "Legal Exp.", amount: 100 },
  ],
  acp: [
    { id: "exp-4", date: "10-02-2025", name: "ROC filing fee", amount: 2200 },
  ],
  "auto-prime": [
    { id: "exp-5", date: "18-03-2025", name: "Courier", amount: 350 },
    { id: "exp-6", date: "21-03-2025", name: "Challan paid", amount: 1500 },
  ],
  mohan: [],
  madhav: [],
};

const invoiceRows = [
  { id: "b430-1", title: "GST Package - 2024-25", sac: "-", amount: 12000, gst: 18 },
  { id: "b430-2", title: "GST Package - 2023-24", sac: "-", amount: 12000, gst: 18 },
  { id: "b430-3", title: "Composition Package - 2024-25", sac: "-", amount: 12000, gst: 18 },
  { id: "b430-4", title: "Test - 2024-25", sac: "-", amount: 100, gst: 0 },
];

const invoices = [
  { id: "B430", date: "04-02-2025", dueDate: "19-02-2025", entityId: "primary", clientId: "anil", amount: 42580, status: "Unpaid", rows: invoiceRows },
  { id: "B429", date: "01-02-2025", dueDate: "16-02-2025", entityId: "primary", clientId: "auto-prime", amount: 1298, status: "Unpaid" },
  { id: "B428", date: "01-02-2025", dueDate: "01-02-2025", entityId: "primary", clientId: "anil", amount: 1298, status: "Unpaid" },
  { id: "B427", date: "31-01-2025", dueDate: "15-02-2025", entityId: "primary", clientId: "mohan", amount: 531, status: "Unpaid" },
  { id: "B426", date: "31-01-2025", dueDate: "15-02-2025", entityId: "primary", clientId: "mohan", amount: 1298, status: "Unpaid" },
  { id: "100", date: "31-01-2025", dueDate: "15-02-2025", entityId: "secondary", clientId: "acp", amount: 5000, status: "Unpaid" },
  { id: "099", date: "31-01-2025", dueDate: "15-02-2025", entityId: "secondary", clientId: "acp", amount: 500, status: "Unpaid" },
  { id: "B425", date: "31-01-2025", dueDate: "31-01-2025", entityId: "primary", clientId: "madhav", amount: 1298, status: "Unpaid" },
  { id: "4545", date: "16-05-2025", dueDate: "31-05-2025", entityId: "primary", clientId: "acp", amount: 590, status: "Unpaid" },
  { id: "6598", date: "12-05-2025", dueDate: "27-05-2025", entityId: "primary", clientId: "anil", amount: 5900, status: "Unpaid" },
  { id: "1234", date: "04-04-2025", dueDate: "19-04-2025", entityId: "primary", clientId: "anil", amount: 1416, status: "Partial" },
  { id: "101", date: "01-03-2025", dueDate: "16-03-2025", entityId: "secondary", clientId: "anil", amount: 500, status: "Partial" },
];

const paymentTerms = [
  { id: "NET 7", days: 7 },
  { id: "NET 15", days: 15 },
  { id: "NET 30", days: 30 },
];

const formatCurrency = (amount) =>
  `\u20b9${Number(amount || 0).toLocaleString("en-IN", {
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

const amountInWords = (amount) => {
  if (amount === 42580) return "Forty Two Thousands Five Hundred and Eighty Rupees only.";
  return `${formatCurrency(amount)} only.`;
};

const getClient = (id) => clients.find((client) => client.id === id) || clients[0];
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

const InvoicesList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredInvoices = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const client = getClient(invoice.clientId);
      const entity = getEntity(invoice.entityId);
      if (clientFilter && invoice.clientId !== clientFilter) return false;
      if (!normalized) return true;

      return [invoice.id, client.name, entity.name, invoice.status]
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [clientFilter, query]);

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
                placeholder="Search invoice no., client, billing entity"
              />
            </div>
          </div>

          <div className="invoice-field">
            <label>Client</label>
            <div className="invoice-control-shell">
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="">Select...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
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
            <button type="button" className="invoice-secondary-button" onClick={() => toast.info("Invoice export prepared.")}>
              <Download size={16} />
              Export
            </button>
            <button type="button" className="invoice-primary-button" onClick={() => navigate("/dashboard/invoices/new")}>
              <Plus size={16} />
              New
            </button>
          </div>

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
                    <td>{getClient(invoice.clientId).name}</td>
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
        </section>
      </div>
    </DashboardLayout>
  );
};

const NewInvoice = () => {
  const navigate = useNavigate();
  const today = formatInputDate(new Date("2025-05-18"));
  const [entityId, setEntityId] = useState("primary");
  const [clientId, setClientId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [paymentTerm, setPaymentTerm] = useState("NET 15");
  const [rows, setRows] = useState([]);
  const [expensePickerOpen, setExpensePickerOpen] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  const term = paymentTerms.find((item) => item.id === paymentTerm) || paymentTerms[1];
  const dueDate = addDays(invoiceDate, term.days);
  const currentExpenses = clientId ? unbilledExpenses[clientId] || [] : [];

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
    setClientId(value);
    setRows((unbilledItems[value] || []).map((row) => ({ ...row, description: "" })));
    setSelectedExpenses([]);
  };

  const updateRow = (rowId, key, value) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
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
        description: `Reimbursement for expense dated ${expense.date}`,
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
    if (!clientId) {
      toast.error("Select a client before saving the invoice.");
      return;
    }

    toast.success("Invoice generated. Auto email and WhatsApp will be sent if configured.");
    navigate(`/dashboard/invoices/${invoiceNo || "B430"}`);
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
          <h1>New Invoice</h1>
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
                <select value={clientId} onChange={(event) => handleClientChange(event.target.value)}>
                  <option value="">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.code}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Invoice No. <span>*</span></label>
              <input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} placeholder="B431" />
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
                      Select a client to get unbilled task(s)
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className={`invoice-item-row invoice-item-row--${row.type}`}>
                      <td className="invoice-drag">=</td>
                      <td>
                        <div className="invoice-item-title-line">
                          {row.manual ? (
                            <input
                              value={row.title}
                              onChange={(event) => updateRow(row.id, "title", event.target.value)}
                              placeholder="Item"
                            />
                          ) : (
                            <strong>{row.title}</strong>
                          )}
                          {row.status && <span className={`invoice-mini-status invoice-mini-status--${row.status.toLowerCase()}`}>{row.status}</span>}
                        </div>
                        <div className="invoice-item-subgrid">
                          {row.manual && (
                            <input
                              value={row.sac || ""}
                              onChange={(event) => updateRow(row.id, "sac", event.target.value)}
                              placeholder="SAC"
                            />
                          )}
                          <textarea
                            value={row.description || ""}
                            onChange={(event) => updateRow(row.id, "description", event.target.value)}
                            placeholder="Description"
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(row.selected)}
                          onChange={(event) => updateRow(row.id, "selected", event.target.checked)}
                          aria-label={`Select ${row.title || "manual item"}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.discount}
                          onChange={(event) => updateRow(row.id, "discount", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.gst}
                          onChange={(event) => updateRow(row.id, "gst", event.target.value)}
                        />
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
              {clientId && currentExpenses.length > 0 && (
                <div className="invoice-expense-callout">
                  <p>{currentExpenses.length} expenses is not billed</p>
                  <button type="button" className="invoice-soft-button" onClick={() => setExpensePickerOpen(true)}>
                    <Plus size={16} />
                    Add Expenses
                  </button>
                </div>
              )}
            </div>

            <TotalsPanel totals={totals} splitTax={getEntity(entityId).address.includes("Gujarat")} />
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
                <h2 id="expense-modal-title">Unbilled Expenses</h2>
                <IconButton label="Close expenses" onClick={() => setExpensePickerOpen(false)}>
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
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(event) => {
                            setSelectedExpenses((current) =>
                              event.target.checked
                                ? [...current, expense.id]
                                : current.filter((id) => id !== expense.id)
                            );
                          }}
                          aria-label={`Select ${expense.name}`}
                        />
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

const InvoiceView = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [shareOpen, setShareOpen] = useState(false);

  const invoice =
    invoices.find((item) => item.id === invoiceId) ||
    {
      ...invoices[0],
      id: invoiceId || invoices[0].id,
      date: "18-05-2025",
      dueDate: "02-06-2025",
    };
  const entity = getEntity(invoice.entityId);
  const client = getClient(invoice.clientId);
  const rows = invoice.rows || invoiceRows;
  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const gst = rows.reduce((sum, row) => sum + (row.amount * row.gst) / 100, 0);
  const total = subtotal + gst;

  const notify = (message) => {
    toast.success(message);
    setShareOpen(false);
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
                  <button type="button" onClick={() => notify("Invoice email sent to client.")}>
                    <Mail size={16} />
                    Send Email
                  </button>
                  <button type="button" onClick={() => notify("Invoice WhatsApp message sent to client.")}>
                    <MessageCircle size={16} />
                    Send WhatsApp
                  </button>
                  <button type="button" onClick={() => notify("PDF downloaded.")}>
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="invoice-warn-button">Cancel</button>
            <button type="button" className="invoice-secondary-button" onClick={() => navigate("/dashboard/invoices/new")}>Edit</button>
            <button type="button" className="invoice-danger-button">Delete</button>
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
              <strong>{client.name}</strong>
              {client.address.map((line) => <p key={line}>{line}</p>)}
              <p>Mobile: {client.mobile}</p>
              <p>Email: {client.email}</p>
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
                const tax = (row.amount * row.gst) / 100;
                return (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.sac}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>{row.gst}%</td>
                    <td>{formatCurrency(tax)}</td>
                    <td>{formatCurrency(row.amount + tax)}</td>
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

const InvoicesPage = () => {
  const { invoiceId } = useParams();
  const path = window.location.pathname;

  if (path.endsWith("/new")) return <NewInvoice />;
  if (invoiceId) return <InvoiceView />;
  return <InvoicesList />;
};

export default InvoicesPage;

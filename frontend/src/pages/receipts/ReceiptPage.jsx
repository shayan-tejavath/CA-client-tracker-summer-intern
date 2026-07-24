import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Eye,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import {
  createReceipt,
  deleteReceipt,
  getOpenInvoicesByClient,
  getReceiptById,
  updateReceipt,
} from "../../services/receiptService.js";
import "../../styles/invoices.css";

const BILLING_ENTITIES = [
  { id: "Primary", name: "Primary" },
  { id: "Secondary", name: "Secondary" },
];

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Net Banking"];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateInput = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const emptyForm = {
  billingEntity: "Primary",
  receiptDate: formatDateInput(new Date()),
  receiptNo: "",
  paymentMode: "UPI",
  clientId: "",
  receivedAmount: "",
  tdsAmount: "",
  discountAmount: "",
  remark: "",
};

const ReceiptPage = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isNewRoute = location.pathname.endsWith("/new");
  const editSeed = location.state?.receiptToEdit || null;
  const isCreateMode = isNewRoute || Boolean(editSeed);

  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [clients, setClients] = useState([]);
  const [openInvoices, setOpenInvoices] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const currentReceipt = receipt || editSeed;

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients();
        const list = Array.isArray(data) ? data : data?.clients || [];
        setClients(list);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load clients.");
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    if (isCreateMode) {
      if (editSeed) {
        setForm({
          billingEntity: editSeed.billingEntity || "Primary",
          receiptDate: formatDateInput(editSeed.receiptDate),
          receiptNo: editSeed.receiptNo || "",
          paymentMode: editSeed.paymentMode || "UPI",
          clientId: editSeed.client?._id || editSeed.clientId || "",
          receivedAmount: editSeed.receivedAmount ?? "",
          tdsAmount: editSeed.tdsAmount ?? "",
          discountAmount: editSeed.discountAmount ?? "",
          remark: editSeed.remark || "",
        });

        if (editSeed.client?._id || editSeed.clientId) {
          loadOpenInvoices(editSeed.client?._id || editSeed.clientId);
        }
      }
      setLoading(false);
      return;
    }

    if (receiptId) {
      loadReceipt();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId, isCreateMode]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const data = await getReceiptById(receiptId);
      setReceipt(data);

      if (data?.client?._id || data?.clientId) {
        await loadOpenInvoices(data.client?._id || data.clientId, true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load receipt.");
    } finally {
      setLoading(false);
    }
  };

  const loadOpenInvoices = async (clientId, silent = false) => {
    if (!clientId) {
      setOpenInvoices([]);
      return;
    }

    try {
      const data = await getOpenInvoicesByClient(clientId);
      const list = Array.isArray(data) ? data : [];

      setOpenInvoices(
        list.map((item) => ({
          ...item,
          payment: item.balanceAmount || item.dueAmount || 0,
        }))
      );
      setSelectedPayments([]);
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.message || "Unable to load invoices for client.");
      }
    }
  };

  const handleClientChange = async (clientId) => {
    setForm((prev) => ({ ...prev, clientId }));
    await loadOpenInvoices(clientId);
  };

  const totalAvailableAmount = useMemo(() => {
    return (
      Number(form.receivedAmount || 0) +
      Number(form.tdsAmount || 0) +
      Number(form.discountAmount || 0)
    );
  }, [form.receivedAmount, form.tdsAmount, form.discountAmount]);

  const totalAppliedAmount = useMemo(() => {
    return openInvoices.reduce((sum, invoice) => sum + Number(invoice.payment || 0), 0);
  }, [openInvoices]);

  const remainingAmount = Math.max(totalAvailableAmount - totalAppliedAmount, 0);

  const autoApply = () => {
    let remaining = totalAvailableAmount;

    setOpenInvoices((current) =>
      current.map((invoice) => {
        if (remaining <= 0) {
          return { ...invoice, payment: 0 };
        }

        const due = Number(invoice.dueAmount || invoice.balanceAmount || 0);
        const payment = Math.min(remaining, due);
        remaining -= payment;

        return { ...invoice, payment };
      })
    );
  };

  const updatePayment = (invoiceId, value) => {
    const numericValue = Math.max(Number(value || 0), 0);

    setOpenInvoices((current) =>
      current.map((invoice) =>
        invoice.id === invoiceId || invoice._id === invoiceId
          ? { ...invoice, payment: numericValue }
          : invoice
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.clientId) {
      toast.error("Select a client.");
      return;
    }

    const payload = {
      billingEntity: form.billingEntity,
      receiptDate: form.receiptDate,
      receiptNo: form.receiptNo,
      paymentMode: form.paymentMode,
      client: form.clientId,
      receivedAmount: Number(form.receivedAmount || 0),
      tdsAmount: Number(form.tdsAmount || 0),
      discountAmount: Number(form.discountAmount || 0),
      remark: form.remark,
      settlements: openInvoices
        .filter((invoice) => Number(invoice.payment || 0) > 0)
        .map((invoice) => ({
          invoice: invoice.id || invoice._id,
          settledAmount: Number(invoice.payment || 0),
        })),
    };

    try {
      setSaving(true);

      const result =
        isCreateMode && !editSeed
          ? await createReceipt(payload)
          : await updateReceipt(receiptId, payload);

      toast.success("Receipt saved successfully.");
      navigate(`/dashboard/receipts/${result?._id || receiptId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save receipt.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this receipt?");
    if (!confirmDelete) return;

    try {
      await deleteReceipt(receiptId);
      toast.success("Receipt deleted successfully.");
      navigate("/dashboard/receipts");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete receipt.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Receipt ${currentReceipt?.receiptNo || receiptId}`,
      text: `Receipt ${currentReceipt?.receiptNo || receiptId} for ${
        currentReceipt?.client?.clientName || "client"
      }`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Receipt link copied.");
      }
    } catch {
      toast.info("Share cancelled.");
    }
  };

  const handleOpenMessaging = () => {
    if (!currentReceipt || !currentReceipt.client) return;

    const clientPayload = {
      _id: currentReceipt.client._id || currentReceipt.clientId,
      name: currentReceipt.client.clientName || currentReceipt.client.name,
      email: currentReceipt.client.email,
      mobile: currentReceipt.client.mobile,
      phone: currentReceipt.client.phone,
    };

    const receiptUrl = window.location.href;
    const subject = `Receipt ${currentReceipt.receiptNo || receiptId}`;
    const body = `Dear ${currentReceipt.client.clientName || currentReceipt.client.name || "Client"},\n\nPlease find your receipt here: ${receiptUrl}\n\nThank you for your payment.`;

    navigate("/dashboard/messages", {
      state: {
        client: clientPayload,
        messageDraft: {
          subject,
          body,
          payload: {
            receiptId: receiptId,
            receiptNo: currentReceipt.receiptNo,
            receiptUrl,
          },
          metadata: {
            source: "ca-client-tracker-receipt",
            receiptId: receiptId,
            receiptNo: currentReceipt.receiptNo,
            receiptUrl,
          },
        },
      },
    });
  };

  const renderView = () => {
    const receiptData = currentReceipt;
    const settlements = receiptData?.settlements || [];
    const client = receiptData?.client || {};

    return (
      <section className="invoice-document">
        <header className="invoice-doc-header">
          <div>
            <div className="invoice-logo-mark">
              <span style={{ fontSize: 38, fontWeight: 800 }}>Q</span>
              <span>QWIKCA</span>
            </div>
            <h2>QwikCA Practice Suite</h2>
            <p>Receipts and Payment Management</p>
          </div>
          <h2 className="invoice-doc-title">Receipt</h2>
        </header>

        <section className="invoice-doc-client">
          <div>
            <p>Received From:</p>
            <strong>{client.clientName || "Client"}</strong>
            <p>{client.clientCode || ""}</p>
            <p>{client.address || ""}</p>
            {client.mobile ? <p>Mobile: {client.mobile}</p> : null}
            {client.email ? <p>Email: {client.email}</p> : null}
          </div>

          <dl>
            <div>
              <dt>Receipt No.:</dt>
              <dd>{receiptData?.receiptNo}</dd>
            </div>
            <div>
              <dt>Receipt Date:</dt>
              <dd>{formatDisplayDate(receiptData?.receiptDate)}</dd>
            </div>
            <div>
              <dt>Billing Entity:</dt>
              <dd>{receiptData?.billingEntity}</dd>
            </div>
            <div>
              <dt>Payment Mode:</dt>
              <dd>{receiptData?.paymentMode}</dd>
            </div>
          </dl>
        </section>

        <table className="invoice-doc-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Invoice No</th>
              <th>Invoice Amount</th>
              <th>Due Amount</th>
              <th>Settled Amount</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length > 0 ? (
              settlements.map((settlement, index) => (
                <tr key={`${settlement.invoiceNo || settlement.invoice}-${index}`}>
                  <td>Payment received through {receiptData?.paymentMode || "UPI"}</td>
                  <td>
                    {settlement.invoiceNo ||
                      settlement.invoice?.invoiceNo ||
                      settlement.invoice?.invoiceNumber ||
                      "-"}
                  </td>
                  <td>
                    {formatCurrency(
                      settlement.invoiceAmount ||
                        settlement.invoice?.grandTotal ||
                        settlement.invoice?.amount ||
                        0
                    )}
                  </td>
                  <td>{formatCurrency(settlement.dueAmount || settlement.invoice?.balanceAmount || 0)}</td>
                  <td>{formatCurrency(settlement.settledAmount || 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No invoice settlements available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="invoice-doc-footer">
          <div>
            <p className="invoice-words">{formatCurrency(receiptData?.totalAmount || 0)} only.</p>
            <div className="invoice-qr-box">
              <div>
                <p>Receipt generated successfully.</p>
                <p>Received Amount</p>
                <strong>{formatCurrency(receiptData?.receivedAmount || 0)}</strong>
              </div>
              <div className="invoice-fake-qr" aria-label="Receipt QR placeholder" />
            </div>

            <div className="invoice-bank-details">
              <p>Remark</p>
              <p>{receiptData?.remark || "—"}</p>
            </div>
          </div>

          <div className="invoice-summary">
            <div>
              <span>Received:</span>
              <strong>{formatCurrency(receiptData?.receivedAmount || 0)}</strong>
            </div>
            <div>
              <span>TDS:</span>
              <strong>{formatCurrency(receiptData?.tdsAmount || 0)}</strong>
            </div>
            <div>
              <span>Discount:</span>
              <strong>{formatCurrency(receiptData?.discountAmount || 0)}</strong>
            </div>
            <div className="invoice-summary-total">
              <span>Total:</span>
              <strong>{formatCurrency(receiptData?.totalAmount || 0)}</strong>
            </div>
            <div>
              <span>Applied:</span>
              <strong>{formatCurrency(receiptData?.appliedAmount || 0)}</strong>
            </div>
            <div>
              <span>Unapplied:</span>
              <strong>{formatCurrency(receiptData?.unappliedAmount || 0)}</strong>
            </div>
            <div>
              <span>Ledger Balance:</span>
              <strong>{formatCurrency(receiptData?.ledgerBalance || 0)}</strong>
            </div>
            <div className="invoice-signature">
              <span>For QwikCA</span>
            </div>
          </div>
        </section>
      </section>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="invoice-form-panel">
      <div className="invoice-form-grid">
        <div className="invoice-field">
          <label>
            Billing Entity <span>*</span>
          </label>
          <div className="invoice-control-shell">
            <select
              value={form.billingEntity}
              onChange={(e) => setForm((prev) => ({ ...prev, billingEntity: e.target.value }))}
            >
              {BILLING_ENTITIES.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="invoice-field">
          <label>
            Date <span>*</span>
          </label>
          <div className="invoice-control-shell">
            <CalendarDays size={18} />
            <input
              type="date"
              value={form.receiptDate}
              onChange={(e) => setForm((prev) => ({ ...prev, receiptDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="invoice-field">
          <label>
            Receipt No. <span>*</span>
          </label>
          <input
            value={form.receiptNo}
            onChange={(e) => setForm((prev) => ({ ...prev, receiptNo: e.target.value }))}
            placeholder="RPT001"
          />
        </div>

        <div className="invoice-field">
          <label>
            Payment Mode <span>*</span>
          </label>
          <div className="invoice-control-shell">
            <select
              value={form.paymentMode}
              onChange={(e) => setForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="invoice-field">
          <label>
            Client <span>*</span>
          </label>
          <div className="invoice-control-shell">
            <select
              value={form.clientId}
              onChange={async (e) => {
                const value = e.target.value;
                setForm((prev) => ({ ...prev, clientId: value }));
                await loadOpenInvoices(value);
              }}
            >
              <option value="">Select client...</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.clientName} {client.clientCode ? `(${client.clientCode})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          {form.clientId ? (
            <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
              Ledger balance: {formatCurrency(currentReceipt?.ledgerBalance || 0)}
            </div>
          ) : null}
        </div>

        <div className="invoice-field">
          <label>
            Received Amount <span>*</span>
          </label>
          <input
            type="number"
            value={form.receivedAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, receivedAmount: e.target.value }))}
            min="0"
          />
        </div>

        <div className="invoice-field">
          <label>TDS Amount</label>
          <input
            type="number"
            value={form.tdsAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, tdsAmount: e.target.value }))}
            min="0"
          />
        </div>

        <div className="invoice-field">
          <label>Discount</label>
          <input
            type="number"
            value={form.discountAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, discountAmount: e.target.value }))}
            min="0"
          />
        </div>

        <div className="invoice-field">
          <label>Total Amount</label>
          <div className="invoice-control-shell invoice-control-shell--disabled">
            <input value={formatCurrency(totalAvailableAmount)} readOnly />
          </div>
        </div>

        <div className="invoice-field invoice-field--wide">
          <label>Remark</label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
            rows={4}
            placeholder="Add a remark..."
          />
        </div>
      </div>

      <div className="invoice-items-heading">
        <h2>Settle invoices</h2>
        <button type="button" className="invoice-secondary-button" onClick={autoApply}>
          Auto Apply
        </button>
      </div>

      <div className="invoice-items-scroll">
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Invoice Date</th>
              <th>Invoice No.</th>
              <th>Total Amount</th>
              <th>Due Amount</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {openInvoices.length > 0 ? (
              openInvoices.map((invoice) => (
                <tr key={invoice.id || invoice._id}>
                  <td>{formatDisplayDate(invoice.invoiceDate)}</td>
                  <td>{invoice.invoiceNo}</td>
                  <td>{formatCurrency(invoice.totalAmount)}</td>
                  <td>{formatCurrency(invoice.dueAmount)}</td>
                  <td>
                    <input
                      type="number"
                      value={invoice.payment}
                      min="0"
                      max={invoice.dueAmount}
                      onChange={(e) => updatePayment(invoice.id || invoice._id, e.target.value)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="invoice-empty-row">
                  Select a client to load open invoices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="invoice-bottom-grid">
        <div className="invoice-expense-callout">
          <p>
            Available Amount: {formatCurrency(totalAvailableAmount)} | Applied:{" "}
            {formatCurrency(totalAppliedAmount)} | Remaining: {formatCurrency(remainingAmount)}
          </p>
        </div>

        <aside className="invoice-totals-panel">
          <div>
            <span>Received</span>
            <strong>{formatCurrency(Number(form.receivedAmount || 0))}</strong>
          </div>
          <div>
            <span>TDS</span>
            <strong>{formatCurrency(Number(form.tdsAmount || 0))}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>{formatCurrency(Number(form.discountAmount || 0))}</strong>
          </div>
          <div className="invoice-total-final">
            <span>Total Amount</span>
            <strong>{formatCurrency(totalAvailableAmount)}</strong>
          </div>
        </aside>
      </div>

      <div className="invoice-form-actions">
        <button
          type="button"
          className="invoice-secondary-button"
          onClick={() => navigate("/dashboard/receipts")}
        >
          Cancel
        </button>
        <button type="submit" className="invoice-primary-button" disabled={saving}>
          <Check size={16} />
          {saving ? "Saving..." : "Save Receipt"}
        </button>
      </div>
    </form>
  );

  if (loading && !isCreateMode) {
    return (
      <DashboardLayout>
        <div className="invoices-page">
          <div className="invoice-empty-row" style={{ padding: 24, textAlign: "center" }}>
            Loading receipt...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-view-toolbar">
          <div className="invoice-breadcrumb">
            <button
              type="button"
              onClick={() => navigate("/dashboard/receipts")}
              aria-label="Back to receipts"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              className="invoice-crumb-link"
              onClick={() => navigate("/dashboard/receipts")}
            >
              Receipts
            </button>
            <span>/</span>
            <h1>{isCreateMode ? "New Receipt" : `#${currentReceipt?.receiptNo || receiptId}`}</h1>
          </div>

          {!isCreateMode && !isEditing ? (
            <div className="invoice-view-actions">
              <button type="button" className="invoice-secondary-button" onClick={handleOpenMessaging}>
                <MessageCircle size={16} />
                Send Receipt
              </button>
              <button type="button" className="invoice-secondary-button" onClick={handleShare}>
                <Share2 size={16} />
                Share
              </button>
              <button type="button" className="invoice-secondary-button" onClick={() => window.print()}>
                <Printer size={16} />
                Print
              </button>
              <button type="button" className="invoice-secondary-button" onClick={() => setIsEditing(true)}>
                <Eye size={16} />
                Edit
              </button>
              <button type="button" className="invoice-danger-button" onClick={handleDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {isCreateMode || isEditing ? renderForm() : renderView()}

        {!isCreateMode && !isEditing ? (
          <div className="invoice-form-actions no-print">
            <button
              type="button"
              className="invoice-secondary-button"
              onClick={() => navigate("/dashboard/receipts")}
            >
              Back to Receipts
            </button>
            <button type="button" className="invoice-primary-button" onClick={() => setIsEditing(true)}>
              <Plus size={16} />
              Edit Receipt
            </button>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default ReceiptPage;
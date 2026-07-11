import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  Pencil,
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
import { getClients } from "../../services/clientService.js";
import invoiceService from "../../services/invoiceService.js";
import quotationService from "../../services/quotationService.js";
import { getServices } from "../../services/serviceService.js";
import { getBillingEntities, getBillingEntityById, getBillingEntityByName } from "../../constants/billingEntities.js";
import "../../styles/invoices.css";

const quotationStatuses = ["Draft", "Sent", "Accepted", "Rejected"];

const createEmptyQuotationItem = (id = `item-${Date.now()}`) => ({
  id,
  selectedServiceId: "",
  title: "",
  description: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  gstPercentage: 0,
  amount: 0,
});

const normalizeQuotationItem = (item = {}, index = 0) => {
  const quantity = Number(item.quantity || 1);
  const rate = Number(item.rate || item.unitPrice || 0);
  const discount = Number(item.discount || 0);
  const gstPercentage = Number(item.gstPercentage || item.gst || 0);
  const amount = Math.max(quantity * rate - discount, 0);

  return {
    id: item.id || `item-${index + 1}`,
    selectedServiceId: item.selectedServiceId || "",
    title: item.title || "",
    description: item.description || "",
    quantity,
    rate,
    discount,
    gstPercentage,
    amount,
  };
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatInputDate = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const getServiceDisplayName = (service = {}) => {
  const category = String(service.serviceCategory || "").trim();
  const subService = String(service.subService || "").trim();
  if (category && subService) return `${category} / ${subService}`;
  if (subService) return subService;
  return String(service.name || service.title || "Unnamed service");
};

const getServiceDefaultRate = (service = {}) => {
  const candidates = [service.defaultPrice, service.defaultBillingRate, service.servicePrice, service.price, service.rate, service.unitPrice];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

const getServiceDefaultGst = (service = {}) => {
  const candidates = [service.gstPercentage, service.gst, service.taxPercentage];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

const displayDate = (value) => {
  if (!value) return "";
  const str = String(value);
  if (str.includes("-") && str.split("-")[0].length === 4) {
    const [year, month, day] = str.split("-");
    return `${day}-${month}-${year}`;
  }
  return str;
};

const getStatusClassName = (status) => {
  const normalized = String(status || "draft").toLowerCase();

  switch (normalized) {
    case "sent":
      return "invoice-status--sent";
    case "accepted":
      return "invoice-status--accepted";
    case "rejected":
      return "invoice-status--rejected";
    default:
      return "invoice-status--draft";
  }
};

const StatusBadge = ({ status }) => (
  <span className={`invoice-status ${getStatusClassName(status)}`}>
    {status || "Draft"}
  </span>
);

const generateNextQuotationNumber = (quotations = []) => {
  const numbers = quotations
    .map((quotation) => {
      const raw = String(quotation?.quotationNumber || "").trim();
      const match = raw.match(/(\d+)/g);
      if (!match || match.length === 0) return null;
      const last = match[match.length - 1];
      const parsed = Number(last);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((value) => value !== null);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `QTN-${String(next).padStart(4, "0")}`;
};

const buildInvoicePayloadFromQuotation = (quotation = {}) => {
  const items = Array.isArray(quotation.items)
    ? quotation.items.map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || item.rate || 0);
        const discount = Number(item.discount || 0);
        const taxableAmount = Math.max(quantity * unitPrice - discount, 0);
        const gst = Number(item.gstPercentage || item.gst || 0);

        return {
          title: item.title || item.description || "Item",
          description: item.description || "",
          amount: taxableAmount,
          discount,
          gst,
          selected: true,
          type: "manual",
        };
      })
    : [];

  return {
    billingEntity: quotation.billingEntity || "Primary",
    client: quotation.clientId?._id || quotation.clientId || quotation.client?._id || "",
    quotationId: quotation._id || "",
    invoiceDate: quotation.quotationDate || formatInputDate(new Date()),
    dueDate: quotation.validityDate || formatInputDate(new Date()),
    paymentTerm: "NET 15",
    items,
    notes: quotation.notes || "",
  };
};

const QuotationsList = ({ quotations, loading, navigate, setQuotations }) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredQuotations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const matches = quotations.filter((quotation) => {
      const matchesStatus = statusFilter === "All" || quotation.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalized) return true;

      const haystack = [
        quotation.quotationNumber,
        quotation.clientId?.clientName || quotation.client?.clientName || "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    return [...matches].sort((left, right) => {
      const leftDate = new Date(left.quotationDate || 0).getTime();
      const rightDate = new Date(right.quotationDate || 0).getTime();
      return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [query, quotations, sortOrder, statusFilter]);

  const handleDuplicate = async (quotation) => {
    try {
      const duplicatePayload = {
        quotationNumber: generateNextQuotationNumber(quotations),
        billingEntity: quotation.billingEntity || "Primary",
        clientId: quotation.clientId?._id || quotation.clientId || quotation.client?._id || "",
        quotationDate: quotation.quotationDate || formatInputDate(new Date()),
        validityDate: quotation.validityDate || formatInputDate(new Date()),
        status: "Draft",
        items: Array.isArray(quotation.items)
          ? quotation.items.map((item) => ({
              title: item.title || item.description || "Item",
              description: item.description || "",
              quantity: Number(item.quantity || 0),
              unitPrice: Number(item.unitPrice || item.rate || 0),
              discount: Number(item.discount || 0),
              gstPercentage: Number(item.gstPercentage || item.gst || 0),
              amount: Number(item.amount || 0),
            }))
          : [],
        subtotal: Number(quotation.subtotal || 0),
        gstPercentage: Number(quotation.gstPercentage || 0),
        gstAmount: Number(quotation.gstAmount || 0),
        totalAmount: Number(quotation.totalAmount || 0),
        notes: quotation.notes || "",
        termsAndConditions: quotation.termsAndConditions || "",
      };

      const created = await quotationService.createQuotation(duplicatePayload);
      setQuotations((current) => [created, ...current]);
      toast.success("Quotation duplicated as a draft.");
      navigate("/dashboard/quotations/new", { state: { quotationToEdit: created } });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to duplicate quotation.");
    }
  };

  const handleDelete = async (quotation) => {
    if (!window.confirm(`Delete quotation ${quotation.quotationNumber || "this record"}?`)) return;

    try {
      await quotationService.deleteQuotation(quotation._id);
      setQuotations((current) => current.filter((item) => item._id !== quotation._id));
      toast.info("Quotation removed from the list.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete quotation.");
    }
  };

  const handleConvertToInvoice = async (quotation) => {
    if (!quotation?._id || quotation.status !== "Accepted") return;

    try {
      const created = await invoiceService.createInvoice(buildInvoicePayloadFromQuotation(quotation));
      await quotationService.updateQuotation(quotation._id, { invoiceId: created._id });
      setQuotations((current) => current.map((item) => (item._id === quotation._id ? { ...item, invoiceId: created._id } : item)));
      toast.success("Quotation converted to invoice.");
      navigate(`/dashboard/invoices/${created._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to convert quotation to invoice.");
    }
  };

  const handleShareQuotation = async (quotation) => {
    try {
      const response = await quotationService.shareQuotation(quotation._id, { channel: "email" });
      setQuotations((current) => current.map((item) => (item._id === quotation._id ? { ...item, status: "Sent" } : item)));
      toast.success(response?.message || "Quotation shared successfully.");

      if (response?.pdfBase64) {
        const binary = atob(response.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = response.pdfFileName || `${quotation.quotationNumber || "quotation"}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to share quotation.");
    }
  };

  const handleDownloadPdf = async (quotation) => {
    if (!quotation?._id) return;

    try {
      const blob = await quotationService.downloadQuotationPdf(quotation._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quotation.quotationNumber || "quotation"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Quotation PDF downloaded.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download quotation PDF.");
    }
  };

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-breadcrumb">
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </button>
          <h1>Quotations</h1>
        </div>

        <section className="invoice-filter-panel">
          <div className="invoice-field">
            <label>Status</label>
            <div className="invoice-control-shell">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">All Status</option>
                {quotationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
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
                placeholder="Search quotation no. or client"
              />
            </div>
          </div>

          <div className="invoice-field">
            <label>Sort By Date</label>
            <div className="invoice-control-shell">
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="invoice-filter-actions">
            <button type="button" className="invoice-icon-button" onClick={() => navigate("/dashboard/quotations/new")}>
              <Plus size={20} />
            </button>
            <button
              type="button"
              className="invoice-icon-button"
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
                setSortOrder("desc");
              }}
            >
              <RefreshCw size={18} />
            </button>
            <button type="button" className="invoice-icon-button">
              <Send size={18} />
            </button>
          </div>
        </section>

        <section className="invoice-table-panel">
          <div className="invoice-list-actions">
            <button type="button" className="invoice-secondary-button" onClick={() => handleDownloadPdf(filteredQuotations[0])}>
              <Download size={16} />
              Download PDF
            </button>
            <button type="button" className="invoice-primary-button" onClick={() => navigate("/dashboard/quotations/new")}>
              <Plus size={16} />
              New
            </button>
          </div>

          {loading ? (
            <div className="invoice-empty-row invoice-empty-row--loading">
              <div className="invoice-loading-indicator" aria-label="Loading quotations">
                <RefreshCw size={20} className="invoice-loading-spinner" />
                <div>
                  <p>Loading quotations...</p>
                  <span>Fetching the latest client quotes and statuses.</span>
                </div>
              </div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="invoice-empty-row invoice-empty-row--empty">
              <div className="invoice-empty-icon">
                <FileText size={22} />
              </div>
              <h3>No quotations created yet</h3>
              <p>Start with a fresh quotation to keep client requests organized and professional.</p>
              <button type="button" className="invoice-primary-button" onClick={() => navigate("/dashboard/quotations/new")}>
                Create your first quotation
              </button>
            </div>
          ) : (
            <div className="quotation-card-grid">
              {filteredQuotations.map((quotation) => (
                <article key={quotation._id} className="quotation-card">
                  <div className="quotation-card-header">
                    <div>
                      <p className="quotation-card-eyebrow">Quotation</p>
                      <button type="button" className="invoice-link" onClick={() => navigate(`/dashboard/quotations/${quotation._id}`)}>
                        {quotation.quotationNumber}
                      </button>
                    </div>
                    <StatusBadge status={quotation.status} />
                  </div>

                  <div className="quotation-card-body">
                    <div className="quotation-card-meta">
                      <span className="quotation-card-label">Client</span>
                      <strong>{quotation.clientId?.clientName || quotation.client?.clientName || "Client"}</strong>
                    </div>
                    <div className="quotation-card-meta">
                      <span className="quotation-card-label">Billing entity</span>
                      <strong>{quotation.billingEntity || "Primary"}</strong>
                    </div>
                    <div className="quotation-card-meta">
                      <span className="quotation-card-label">Issued</span>
                      <strong>{displayDate(formatInputDate(quotation.quotationDate))}</strong>
                    </div>
                  </div>

                  <div className="quotation-card-footer">
                    <div className="quotation-card-total">
                      <span>Total</span>
                      <strong>{formatCurrency(quotation.totalAmount)}</strong>
                    </div>
                    <div className="quotation-card-actions">
                      <button type="button" className="invoice-icon-button" onClick={() => navigate(`/dashboard/quotations/${quotation._id}`)} title="View">
                        <Eye size={16} />
                      </button>
                      <button type="button" className="invoice-icon-button" onClick={() => navigate("/dashboard/quotations/new", { state: { quotationToEdit: quotation } })} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="invoice-icon-button" onClick={() => handleDuplicate(quotation)} title="Duplicate">
                        <Copy size={16} />
                      </button>
                      {quotation.status === "Accepted" && !quotation.invoiceId && (
                        <button type="button" className="invoice-icon-button" onClick={() => handleConvertToInvoice(quotation)} title="Convert to invoice">
                          <FileText size={16} />
                        </button>
                      )}
                      <button type="button" className="invoice-icon-button" onClick={() => handleShareQuotation(quotation)} title="Send">
                        <Send size={16} />
                      </button>
                      <button type="button" className="invoice-icon-button" onClick={() => handleDownloadPdf(quotation)} title="Download PDF">
                        <Download size={16} />
                      </button>
                      <button type="button" className="invoice-icon-button" onClick={() => handleDelete(quotation)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

const QuotationTotalsPanel = ({ totals }) => (
  <aside className="invoice-totals-panel">
    <div>
      <span>Subtotal</span>
      <strong>{formatCurrency(totals.subtotal)}</strong>
    </div>
    <div>
      <span>GST Amount</span>
      <strong>{formatCurrency(totals.gstAmount)}</strong>
    </div>
    <div className="invoice-total-final">
      <span>Grand Total</span>
      <strong>{formatCurrency(totals.grandTotal)}</strong>
    </div>
  </aside>
);

const QuotationForm = ({ quotations, setQuotations, navigate, location }) => {
  const today = formatInputDate(new Date());
  const editQuotation = location.state?.quotationToEdit || null;
  const clientContext = location.state?.clientContext || null;

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [billingEntities, setBillingEntities] = useState([]);
  const [selectedBillingEntity, setSelectedBillingEntity] = useState("Primary");
  const [billingEntityDetails, setBillingEntityDetails] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationDate, setQuotationDate] = useState(today);
  const [validityDate, setValidityDate] = useState(today);
  const [status, setStatus] = useState("Draft");
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const nextQuotationNumber = useMemo(() => generateNextQuotationNumber(quotations), [quotations]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await getClients();
        const list = Array.isArray(response) ? response : response?.clients || [];
        setClients(list);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Unable to load clients.");
      }
    };

    const loadServicesList = async () => {
      try {
        const response = await getServices();
        const list = Array.isArray(response) ? response : response?.data || response?.services || [];
        setServices(list);
      } catch (error) {
        console.error(error);
      }
    };

    const loadBillingEntities = async () => {
      try {
        const list = await getBillingEntities();
        setBillingEntities(list);
        const initialEntity = getBillingEntityByName("Primary");
        setSelectedBillingEntity(initialEntity.name);
        setBillingEntityDetails(initialEntity);
      } catch (error) {
        console.error(error);
      }
    };

    loadClients();
    loadServicesList();
    loadBillingEntities();
  }, []);

  useEffect(() => {
    if (editQuotation) {
      const matchedEntity = getBillingEntityByName(editQuotation.billingEntity || "Primary");
      setSelectedBillingEntity(matchedEntity.name);
      setBillingEntityDetails(matchedEntity);
      setClientName(editQuotation.clientId?.clientName || editQuotation.client?.clientName || "");
      setClientId(editQuotation.clientId?._id || editQuotation.clientId || editQuotation.client?._id || "");
      setQuotationNumber(editQuotation.quotationNumber || "");
      setQuotationDate(editQuotation.quotationDate ? formatInputDate(editQuotation.quotationDate) : today);
      setValidityDate(editQuotation.validityDate ? formatInputDate(editQuotation.validityDate) : today);
      setStatus(editQuotation.status || "Draft");
      setItems(
        Array.isArray(editQuotation.items)
          ? editQuotation.items.map((item, index) => normalizeQuotationItem(item, index))
          : [createEmptyQuotationItem()]
      );
      setNotes(editQuotation.notes || "");
      setTermsAndConditions(editQuotation.termsAndConditions || "");
      return;
    }

    if (clientContext) {
      setClientName(clientContext.clientName || "");
      setClientId(clientContext._id || clientContext.clientId || "");
    }

    if (!editQuotation) {
      const initialEntity = getBillingEntityByName("Primary");
      setSelectedBillingEntity(initialEntity.name);
      setBillingEntityDetails(initialEntity);
    }

    setQuotationNumber(nextQuotationNumber);
    setItems([createEmptyQuotationItem()]);
  }, [editQuotation, nextQuotationNumber, today]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const gstAmount = items.reduce((sum, item) => {
      const taxableAmount = Number(item.amount || 0);
      const gstRate = Number(item.gstPercentage || 0);
      return sum + (taxableAmount * gstRate) / 100;
    }, 0);

    return {
      subtotal,
      gstAmount,
      grandTotal: subtotal + gstAmount,
    };
  }, [items]);

  const updateItem = (id, key, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [key]: value };
        if (["quantity", "rate", "discount", "gstPercentage"].includes(key)) {
          const quantity = Number(updated.quantity || 0);
          const rate = Number(updated.rate || 0);
          const discount = Number(updated.discount || 0);
          const gstPercentage = Number(updated.gstPercentage || 0);
          updated.amount = Math.max(quantity * rate - discount, 0);
          updated.gstPercentage = gstPercentage;
        }

        return updated;
      })
    );
  };

  const selectServiceForItem = (id, serviceId) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const selectedService = services.find((service) => String(service._id) === String(serviceId));
        const updated = {
          ...item,
          selectedServiceId: serviceId || "",
          title: selectedService ? getServiceDisplayName(selectedService) : item.title || "",
          description: selectedService?.description || item.description || "",
          rate: selectedService ? getServiceDefaultRate(selectedService) : Number(item.rate || 0),
          gstPercentage: selectedService ? getServiceDefaultGst(selectedService) : Number(item.gstPercentage || 0),
        };

        const quantity = Number(updated.quantity || 0);
        const rate = Number(updated.rate || 0);
        const discount = Number(updated.discount || 0);
        const gstPercentage = Number(updated.gstPercentage || 0);
        updated.amount = Math.max(quantity * rate - discount, 0);
        updated.gstPercentage = gstPercentage;

        return updated;
      })
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyQuotationItem()]);
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const saveQuotation = async () => {
    if (!clientName) {
      toast.error("Select a client before saving the quotation.");
      return;
    }

    const matchedClient = clientId
      ? clients.find((client) => client._id === clientId)
      : clients.find((client) => client.clientName === clientName || client.clientCode === clientName);

    if (!matchedClient?._id) {
      toast.error("Select a valid client from the list.");
      return;
    }

    const normalizedItems = items.filter((item) => {
      const title = String(item.title || "").trim();
      const description = String(item.description || "").trim();
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return title || description || quantity > 0 || rate > 0;
    });

    if (normalizedItems.length === 0) {
      toast.error("Add at least one service item before saving the quotation.");
      return;
    }

    const payload = {
      quotationNumber: String(quotationNumber || nextQuotationNumber).trim(),
      billingEntity: selectedBillingEntity,
      clientId: matchedClient._id,
      quotationDate,
      validityDate,
      status,
      items: normalizedItems.map((item) => ({
        title: item.title || item.description || "Item",
        description: item.description || "",
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.rate || 0),
        discount: Number(item.discount || 0),
        gstPercentage: Number(item.gstPercentage || 0),
        amount: Number(item.amount || 0),
      })),
      subtotal: totals.subtotal,
      gstPercentage: 0,
      gstAmount: totals.gstAmount,
      totalAmount: totals.grandTotal,
      notes: notes || billingEntityDetails?.defaultTerms || "",
      termsAndConditions: termsAndConditions || billingEntityDetails?.defaultTerms || "",
    };

    try {
      if (editQuotation?._id) {
        const updated = await quotationService.updateQuotation(editQuotation._id, payload);
        setQuotations((current) => current.map((quotation) => (quotation._id === updated._id ? updated : quotation)));
        toast.success("Quotation updated successfully.");
        navigate(`/dashboard/quotations/${updated._id}`);
      } else {
        const created = await quotationService.createQuotation(payload);
        setQuotations((current) => [created, ...current]);
        toast.success("Quotation created successfully.");
        navigate(`/dashboard/quotations/${created._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save quotation.");
    }
  };

  return (
    <DashboardLayout>
      <div className="invoices-page">
        <div className="invoice-breadcrumb">
          <button type="button" onClick={() => navigate("/dashboard/quotations")} aria-label="Back to quotations">
            <ArrowLeft size={20} />
          </button>
          <button type="button" className="invoice-crumb-link" onClick={() => navigate("/dashboard/quotations")}>
            Quotations
          </button>
          <span>/</span>
          <h1>{editQuotation ? "Edit Quotation" : "New Quotation"}</h1>
        </div>

        <section className="invoice-form-panel">
          <div className="invoice-form-grid">
            <div className="invoice-field">
              <label>Billing Entity</label>
              <div className="invoice-control-shell">
                <select
                  value={selectedBillingEntity}
                  onChange={(event) => {
                    const entityName = event.target.value;
                    const matchedEntity = getBillingEntityByName(entityName);
                    setSelectedBillingEntity(matchedEntity.name);
                    setBillingEntityDetails(matchedEntity);
                    if (!termsAndConditions) {
                      setTermsAndConditions(matchedEntity.defaultTerms || "");
                    }
                  }}
                >
                  {billingEntities.map((entity) => (
                    <option key={entity.id} value={entity.name}>
                      {entity.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Quotation Date</label>
              <div className="invoice-control-shell">
                <CalendarDays size={18} />
                <input type="date" value={quotationDate} onChange={(event) => setQuotationDate(event.target.value)} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Client</label>
              <div className="invoice-control-shell">
                <input
                  value={clientName}
                  onChange={(event) => {
                    setClientName(event.target.value);
                    setClientId("");
                  }}
                  placeholder="Type or select a client"
                  list="quotation-client-list"
                />
                <datalist id="quotation-client-list">
                  {clients.map((client) => (
                    <option key={client._id} value={client.clientName} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="invoice-field">
              <label>Quotation No.</label>
              <input value={quotationNumber} onChange={(event) => setQuotationNumber(event.target.value)} placeholder="QTN-0001" />
            </div>

            <div className="invoice-field">
              <label>Validity Date</label>
              <div className="invoice-control-shell">
                <CalendarDays size={18} />
                <input type="date" value={validityDate} onChange={(event) => setValidityDate(event.target.value)} />
              </div>
            </div>

            <div className="invoice-field">
              <label>Status</label>
              <div className="invoice-control-shell">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {quotationStatuses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {billingEntityDetails && (
            <div className="invoice-billing-entity-summary">
              <div>
                <strong>{billingEntityDetails.firmName}</strong>
                <p>{billingEntityDetails.address.join(", ")}</p>
              </div>
              <div>
                <span>GSTIN</span>
                <strong>{billingEntityDetails.gstin}</strong>
              </div>
              <div>
                <span>PAN</span>
                <strong>{billingEntityDetails.pan}</strong>
              </div>
              <div>
                <span>Bank</span>
                <strong>{billingEntityDetails.bank?.accountName}</strong>
              </div>
            </div>
          )}

          <div className="invoice-items-heading">
            <h2>Service Items</h2>
          </div>

          <div className="invoice-items-scroll">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Service Item</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th>GST %</th>
                  <th>Line Total</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "grid", gap: "6px" }}>
                        <select value={item.selectedServiceId || ""} onChange={(event) => selectServiceForItem(item.id, event.target.value)}>
                          <option value="">Custom / manual entry</option>
                          {services.map((service) => (
                            <option key={service._id} value={service._id}>
                              {getServiceDisplayName(service)}
                            </option>
                          ))}
                        </select>
                        <input value={item.title || ""} onChange={(event) => updateItem(item.id, "title", event.target.value)} placeholder="Service name" />
                      </div>
                    </td>
                    <td>
                      <input value={item.description || ""} onChange={(event) => updateItem(item.id, "description", event.target.value)} placeholder="Description" />
                    </td>
                    <td>
                      <input type="number" min="0" value={item.quantity || 0} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" value={item.rate || 0} onChange={(event) => updateItem(item.id, "rate", event.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" value={item.discount || 0} onChange={(event) => updateItem(item.id, "discount", event.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" value={item.gstPercentage || 0} onChange={(event) => updateItem(item.id, "gstPercentage", event.target.value)} />
                    </td>
                    <td>
                      <input value={formatCurrency((Number(item.amount || 0) * (1 + Number(item.gstPercentage || 0) / 100)).toFixed(2))} readOnly />
                    </td>
                    <td>
                      <button type="button" className="invoice-icon-button" onClick={() => removeItem(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-add-item-wrap">
            <button type="button" className="invoice-soft-button" onClick={addItem}>
              <Plus size={16} />
              Add Service Item
            </button>
          </div>

          <div className="invoice-bottom-grid">
            <div style={{ display: "grid", gap: "12px" }}>
              <div className="invoice-field">
                <label>Notes</label>
                <textarea rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <div className="invoice-field">
                <label>Terms & Conditions</label>
                <textarea rows="3" value={termsAndConditions} onChange={(event) => setTermsAndConditions(event.target.value)} />
              </div>
            </div>
            <QuotationTotalsPanel totals={totals} />
          </div>

          <div className="invoice-form-actions">
            <button type="button" className="invoice-secondary-button" onClick={() => navigate("/dashboard/quotations")}>
              Cancel
            </button>
            <button type="button" className="invoice-primary-button" onClick={saveQuotation}>
              <Check size={16} />
              Save Quotation
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

const QuotationView = ({ quotations, setQuotations, navigate, quotationId }) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const loadQuotation = async () => {
      try {
        setLoading(true);
        const data = await quotationService.getQuotationById(quotationId);
        setQuotation(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load quotation.");
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [quotationId]);

  const handleDelete = async () => {
    if (!quotation?._id) return;

    try {
      await quotationService.deleteQuotation(quotation._id);
      setQuotations((current) => current.filter((item) => item._id !== quotation._id));
      toast.info("Quotation removed from the list.");
      navigate("/dashboard/quotations");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete quotation.");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quotation?._id || quotation.status !== "Accepted") return;

    try {
      const created = await invoiceService.createInvoice(buildInvoicePayloadFromQuotation(quotation));
      await quotationService.updateQuotation(quotation._id, { invoiceId: created._id });
      setQuotations((current) => current.map((item) => (item._id === quotation._id ? { ...item, invoiceId: created._id } : item)));
      toast.success("Quotation converted to invoice.");
      navigate(`/dashboard/invoices/${created._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to convert quotation to invoice.");
    }
  };

  const handleDuplicateFromView = async () => {
    if (!quotation?._id) return;

    try {
      const duplicatePayload = {
        quotationNumber: generateNextQuotationNumber(quotations),
        billingEntity: quotation.billingEntity || "Primary",
        clientId: quotation.clientId?._id || quotation.clientId || quotation.client?._id || "",
        quotationDate: quotation.quotationDate || formatInputDate(new Date()),
        validityDate: quotation.validityDate || formatInputDate(new Date()),
        status: "Draft",
        items: Array.isArray(quotation.items)
          ? quotation.items.map((item) => ({
              title: item.title || item.description || "Item",
              description: item.description || "",
              quantity: Number(item.quantity || 0),
              unitPrice: Number(item.unitPrice || item.rate || 0),
              discount: Number(item.discount || 0),
              gstPercentage: Number(item.gstPercentage || item.gst || 0),
              amount: Number(item.amount || 0),
            }))
          : [],
        subtotal: Number(quotation.subtotal || 0),
        gstPercentage: Number(quotation.gstPercentage || 0),
        gstAmount: Number(quotation.gstAmount || 0),
        totalAmount: Number(quotation.totalAmount || 0),
        notes: quotation.notes || "",
        termsAndConditions: quotation.termsAndConditions || "",
      };

      const created = await quotationService.createQuotation(duplicatePayload);
      setQuotations((current) => [created, ...current]);
      toast.success("Quotation duplicated as a draft.");
      navigate("/dashboard/quotations/new", { state: { quotationToEdit: created } });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to duplicate quotation.");
    }
  };

  const handleShareQuotation = async (channel = "email") => {
    if (!quotation?._id) return;

    try {
      const response = await quotationService.shareQuotation(quotation._id, { channel });
      setQuotation((current) => (current ? { ...current, status: "Sent" } : current));
      setQuotations((current) => current.map((item) => (item._id === quotation._id ? { ...item, status: "Sent" } : item)));
      toast.success(response?.message || "Quotation shared successfully.");
      setShareOpen(false);

      if (response?.pdfBase64) {
        const binary = atob(response.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = response.pdfFileName || `${quotation.quotationNumber || "quotation"}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to share quotation.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation?._id) return;

    try {
      const blob = await quotationService.downloadQuotationPdf(quotation._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quotation.quotationNumber || "quotation"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Quotation PDF downloaded.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download quotation PDF.");
    }
  };

  const logoText = String(quotation?.billingEntity || "Firm")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "F";

  const clientName = quotation?.clientId?.clientName || quotation?.client?.clientName || "Client";
  const clientEmail = quotation?.clientId?.email || quotation?.client?.email || "";
  const clientMobile = quotation?.clientId?.mobile || quotation?.client?.mobile || "";
  const clientGstin = quotation?.clientId?.gstin || quotation?.client?.gstin || "";
  const defaultTerms =
    quotation?.termsAndConditions ||
    "This quotation is valid for 15 days from the date of issue. Payment is due upon receipt of the quotation unless otherwise agreed in writing. Any additional work requested after the quotation date will be billed separately.";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="invoices-page">
          <div className="invoice-empty-row" style={{ padding: "24px", textAlign: "center" }}>
            Loading quotation...
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
            <button type="button" onClick={() => navigate("/dashboard/quotations")} aria-label="Back to quotations">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="invoice-crumb-link" onClick={() => navigate("/dashboard/quotations")}>
              Quotations
            </button>
            <span>/</span>
            <h1>{quotation?.quotationNumber || quotationId}</h1>
          </div>

          <div className="invoice-view-actions">
            <div className="invoice-share-wrap">
              <button type="button" className="invoice-secondary-button" onClick={() => setShareOpen((current) => !current)}>
                <Share2 size={16} />
                Send
              </button>
              {shareOpen && (
                <div className="invoice-share-menu">
                  <button type="button" onClick={() => handleShareQuotation("email")}>
                    <Send size={16} />
                    Email
                  </button>
                  <button type="button" onClick={handleDownloadPdf}>
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="invoice-secondary-button" onClick={handleDownloadPdf}>
              <Download size={16} />
              Download PDF
            </button>
            <button type="button" className="invoice-secondary-button" onClick={() => navigate("/dashboard/quotations/new", { state: { quotationToEdit: quotation } })}>
              Edit
            </button>
            <button type="button" className="invoice-secondary-button" onClick={handleDuplicateFromView}>
              <Copy size={16} />
              Duplicate
            </button>
            {quotation?.status === "Accepted" && !quotation?.invoiceId && (
              <button type="button" className="invoice-primary-button" onClick={handleConvertToInvoice}>
                <FileText size={16} />
                Convert to Invoice
              </button>
            )}
            <button type="button" className="invoice-danger-button" onClick={handleDelete}>
              Delete
            </button>
            <button type="button" className="invoice-primary-button" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        <section className="invoice-document quotation-document">
          <header className="invoice-doc-header quotation-doc-header">
            <div className="quotation-brand-block">
              <div className="invoice-logo-mark quotation-logo-mark">
                <FileText size={52} />
                <span>{logoText}</span>
              </div>
              <div>
                <h2>{quotation?.billingEntity || "Firm Name"}</h2>
                <p>Professional Quotation</p>
              </div>
            </div>
            <div className="quotation-meta-card">
              <div>
                <span>Quotation No.</span>
                <strong>{quotation?.quotationNumber || "—"}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{displayDate(formatInputDate(quotation?.quotationDate))}</strong>
              </div>
              <div>
                <span>Validity</span>
                <strong>{displayDate(formatInputDate(quotation?.validityDate))}</strong>
              </div>
            </div>
          </header>

          <section className="invoice-doc-client quotation-client-section">
            <div className="quotation-party-block">
              <p className="quotation-label">Prepared For</p>
              <strong>{clientName}</strong>
              {clientEmail && <p>{clientEmail}</p>}
              {clientMobile && <p>{clientMobile}</p>}
              {clientGstin && <p>GSTIN: {clientGstin}</p>}
            </div>
            <div className="quotation-party-block">
              <p className="quotation-label">Billing Entity</p>
              <strong>{quotation?.billingEntity || "Primary"}</strong>
              <p>Quotation prepared for professional services</p>
            </div>
          </section>

          <table className="invoice-doc-table quotation-doc-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount</th>
                <th>GST %</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(quotation?.items || []).map((item, index) => (
                <tr key={item.id || `${item.title}-${index}`}>
                  <td>{item.title || item.description || "Service"}</td>
                  <td>{item.description || "—"}</td>
                  <td>{item.quantity || 0}</td>
                  <td>{formatCurrency(item.unitPrice || 0)}</td>
                  <td>{formatCurrency(item.discount || 0)}</td>
                  <td>{Number(item.gstPercentage || 0)}%</td>
                  <td>{formatCurrency(item.amount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="invoice-doc-footer quotation-doc-footer">
            <div className="quotation-terms-block">
              <p className="quotation-label">Notes</p>
              <p>{quotation?.notes || "No additional notes provided."}</p>
              <p className="quotation-label">Terms & Conditions</p>
              <p>{defaultTerms}</p>
            </div>
            <div className="invoice-summary quotation-summary">
              <div>
                <span>Subtotal:</span>
                <strong>{formatCurrency(quotation?.subtotal || 0)}</strong>
              </div>
              <div>
                <span>GST:</span>
                <strong>{formatCurrency(quotation?.gstAmount || 0)}</strong>
              </div>
              <div className="invoice-summary-total">
                <span>Total:</span>
                <strong>{formatCurrency(quotation?.totalAmount || 0)}</strong>
              </div>
            </div>
          </section>

          <section className="quotation-signature-row">
            <div className="quotation-signature-box">
              <p>Prepared By</p>
              <div className="quotation-signature-line" />
              <strong>{quotation?.billingEntity || "Firm Name"}</strong>
            </div>
            <div className="quotation-signature-box">
              <p>Client Acceptance</p>
              <div className="quotation-signature-line" />
              <strong>{clientName}</strong>
            </div>
          </section>
        </section>
      </div>
    </DashboardLayout>
  );
};

const QuotationManagementPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { quotationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        setLoading(true);

        const params = {};
        if (location.pathname.endsWith("/new") && location.state?.clientContext?.clientId) {
          params.clientId = location.state.clientContext.clientId;
        }

        const response = await quotationService.getQuotations(params);
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.quotations)
              ? response.quotations
              : [];
        setQuotations(list);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Unable to load quotations.");
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [location.pathname, location.state]);

  if (path.endsWith("/new")) {
    return <QuotationForm quotations={quotations} setQuotations={setQuotations} navigate={navigate} location={location} />;
  }

  if (quotationId) {
    return <QuotationView quotations={quotations} setQuotations={setQuotations} navigate={navigate} quotationId={quotationId} />;
  }

  return <QuotationsList quotations={quotations} loading={loading} navigate={navigate} setQuotations={setQuotations} />;
};

export default QuotationManagementPage;

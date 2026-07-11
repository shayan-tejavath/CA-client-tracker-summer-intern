import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Landmark,
  Pencil,
  ReceiptText,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { approveExpense, getExpenseById, getExpenseReceiptPreview, markExpensePaid, rejectExpense } from "../../services/expenseService.js";
import "../../styles/expenses.css";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value, includeTime = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const personName = (person) => person?.name || person?.email || "System";

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="expense-detail-item">
    {Icon && <span><Icon size={16} /></span>}
    <div><small>{label}</small><strong>{value || "—"}</strong></div>
  </div>
);

const ExpenseDetailsPage = () => {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    let previewUrl;
    const loadExpense = async () => {
      try {
        setLoading(true);
        const data = await getExpenseById(expenseId);
        setExpense(data);
        if (data.receipt) {
          try {
            const preview = await getExpenseReceiptPreview(expenseId);
            previewUrl = preview.url;
            setReceiptPreview(preview);
          } catch {
            setReceiptPreview({ error: true });
          }
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load expense details.");
      } finally {
        setLoading(false);
      }
    };
    loadExpense();
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [expenseId]);

  if (loading) return <DashboardLayout><div className="expense-details-loading">Loading expense details…</div></DashboardLayout>;
  if (!expense) return <DashboardLayout><div className="expense-details-loading">Expense not found.</div></DashboardLayout>;

  const canApprove = ["SuperAdmin", "Manager"].includes(user?.role);
  const updateWorkflow = async (action) => {
    try {
      const result = await action();
      setExpense(result.expense);
      toast.success(result.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update expense status.");
    }
  };
  const handleReject = () => {
    const rejectionReason = window.prompt("Enter the reason for rejecting this expense:");
    if (!rejectionReason?.trim()) return;
    updateWorkflow(() => rejectExpense(expense._id, rejectionReason.trim()));
  };

  const fallbackActivity = [
    { label: "Expense created", detail: `Recorded by ${personName(expense.createdBy)}`, date: expense.createdAt, tone: "created" },
    ...(new Date(expense.updatedAt).getTime() > new Date(expense.createdAt).getTime() + 1000
      ? [{ label: "Expense updated", detail: `Updated by ${personName(expense.updatedBy)}`, date: expense.updatedAt, tone: "updated" }]
      : []),
    { label: `Status: ${expense.status}`, detail: "Current approval and payment status", date: expense.updatedAt || expense.createdAt, tone: String(expense.status).toLowerCase() },
  ];
  const activity = expense.activityHistory?.length
    ? [...expense.activityHistory].reverse().map((item) => ({
      label: item.action,
      detail: item.details ? `${item.details} · ${personName(item.performedBy)}` : `By ${personName(item.performedBy)}`,
      date: item.createdAt,
      tone: item.action.toLowerCase().includes("receipt") ? "updated" : String(expense.status).toLowerCase(),
    }))
    : fallbackActivity;

  return (
    <DashboardLayout>
      <div className="expenses-page expense-details-page">
        <header className="expense-details-header">
          <div><button type="button" className="expense-back-button" onClick={() => navigate("/dashboard/expenses")}><ArrowLeft size={18} /> Back to expenses</button><p className="expenses-eyebrow">Expense register</p><h1>{expense.expenseNumber}</h1><span>Expense recorded on {formatDate(expense.expenseDate)}</span></div>
          <div className="expense-details-header-actions"><span className={`expense-status expense-status--${String(expense.status).toLowerCase()}`}>{expense.status}</span>{canApprove && expense.status === "Pending" && <><button type="button" className="expense-approve-button" onClick={() => updateWorkflow(() => approveExpense(expense._id))}>Approve</button><button type="button" className="expense-reject-button" onClick={handleReject}>Reject</button></>}{canApprove && expense.status === "Approved" && <button type="button" className="expense-approve-button" onClick={() => updateWorkflow(() => markExpensePaid(expense._id))}>Mark paid</button>}<button type="button" className="expense-edit-button" onClick={() => navigate(`/dashboard/expenses/${expense._id}/edit`)}><Pencil size={16} /> Edit expense</button></div>
        </header>

        <section className="expense-details-highlight">
          <div><span>Total expense</span><strong>{formatCurrency(expense.totalAmount)}</strong><small>Including GST of {formatCurrency(expense.gstAmount)}</small></div>
          <div className="expense-highlight-meta"><DetailItem label="Category" value={expense.category} icon={ReceiptText} /><DetailItem label="Payment mode" value={expense.paymentMode} icon={WalletCards} /><DetailItem label="Expense date" value={formatDate(expense.expenseDate)} icon={CalendarDays} /></div>
        </section>

        <div className="expense-details-layout">
          <div className="expense-details-main">
            <section className="expense-details-card"><header><h2>Expense information</h2><p>Transaction and assignment details</p></header><div className="expense-details-grid"><DetailItem label="Vendor" value={expense.vendor} icon={Landmark} /><DetailItem label="Category" value={expense.category} icon={ReceiptText} /><DetailItem label="Client" value={expense.client?.clientName || expense.client?.clientCode} icon={UserRound} /><DetailItem label="Employee" value={personName(expense.employee)} icon={UserRound} /><DetailItem label="Payment mode" value={expense.paymentMode} icon={WalletCards} /><DetailItem label="Expense date" value={formatDate(expense.expenseDate)} icon={CalendarDays} />{expense.approvedBy && <DetailItem label="Approved by" value={personName(expense.approvedBy)} icon={UserRound} />}{expense.approvedDate && <DetailItem label="Approved date" value={formatDate(expense.approvedDate, true)} icon={CalendarDays} />}</div>{expense.rejectionReason && <p className="expense-rejection-reason"><strong>Rejection reason</strong>{expense.rejectionReason}</p>}</section>
            <section className="expense-details-card"><header><h2>Amount breakdown</h2><p>Tax calculation for this expense</p></header><div className="expense-amount-breakdown"><div><span>Base amount</span><strong>{formatCurrency(expense.amount)}</strong></div><div><span>GST ({expense.gstPercentage || 0}%)</span><strong>{formatCurrency(expense.gstAmount)}</strong></div><div className="expense-total-breakdown"><span>Total amount</span><strong>{formatCurrency(expense.totalAmount)}</strong></div></div></section>
            <section className="expense-details-card"><header><h2>Remarks</h2></header><p className="expense-details-remarks">{expense.remarks || "No remarks added for this expense."}</p></section>
          </div>
          <aside className="expense-details-side">
            <section className="expense-details-card expense-receipt-card"><header><h2>Receipt preview</h2><p>{expense.receipt ? "Supporting document" : "No receipt attached"}</p></header>{!expense.receipt ? <div className="expense-no-receipt"><FileText size={25} /><span>No receipt uploaded</span></div> : receiptPreview?.error ? <div className="expense-no-receipt"><FileText size={25} /><span>Receipt preview is unavailable</span></div> : !receiptPreview ? <div className="expense-no-receipt">Loading preview…</div> : receiptPreview.contentType.includes("pdf") ? <iframe className="expense-pdf-preview" title="Expense receipt preview" src={receiptPreview.url} /> : <img className="expense-image-preview" src={receiptPreview.url} alt={`Receipt for ${expense.expenseNumber}`} />}</section>
            <section className="expense-details-card"><header><h2>Activity history</h2><p>Recent changes to this expense</p></header><ol className="expense-activity-list">{activity.map((item, index) => <li key={`${item.label}-${index}`}><i className={`expense-activity-dot expense-activity-dot--${item.tone}`} /><div><strong>{item.label}</strong><span>{item.detail}</span><small>{formatDate(item.date, true)}</small></div></li>)}</ol></section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpenseDetailsPage;

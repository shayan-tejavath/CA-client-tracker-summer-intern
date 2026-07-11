import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileUp, ReceiptText, Save, X } from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { getExpenseById, updateExpense, uploadExpenseReceipt } from "../../services/expenseService.js";
import "../../styles/expenses.css";

const receiptTypes = ["application/pdf", "image/png", "image/jpeg"];
const getList = (response, keys) => Array.isArray(response) ? response : keys.find((key) => Array.isArray(response?.[key])) ? response[keys.find((key) => Array.isArray(response?.[key]))] : [];

const EditExpensePage = () => {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [expense, clientsResponse, employeesResponse] = await Promise.all([
          getExpenseById(expenseId), getClients({ limit: 100 }), getEmployees(),
        ]);
        setForm({
          expenseDate: String(expense.expenseDate || "").slice(0, 10), category: expense.category || "",
          vendor: expense.vendor || "", client: expense.client?._id || expense.client || "",
          employee: expense.employee?._id || expense.employee || "", paymentMode: expense.paymentMode || "UPI",
          amount: String(expense.amount ?? ""), gstPercentage: String(expense.gstPercentage ?? 0), remarks: expense.remarks || "",
        });
        setExistingReceipt(Boolean(expense.receipt));
        setClients(getList(clientsResponse, ["clients", "data"]));
        setEmployees(getList(employeesResponse, ["employees", "data"]));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load this expense.");
      }
    };
    loadPage();
  }, [expenseId]);

  const totals = useMemo(() => {
    const amount = Math.max(Number(form?.amount) || 0, 0);
    const gst = Math.max(Number(form?.gstPercentage) || 0, 0);
    return { gstAmount: amount * gst / 100, totalAmount: amount * (1 + gst / 100) };
  }, [form]);

  if (!form) return <DashboardLayout><div className="expense-details-loading">Loading expense…</div></DashboardLayout>;
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectReceipt = (file) => {
    if (!file) return setReceipt(null);
    if (!receiptTypes.includes(file.type)) return toast.error("Receipt must be a PDF, PNG, JPG, or JPEG file.");
    setReceipt(file);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.category.trim() || !form.paymentMode || Number(form.amount) <= 0) return toast.error("Enter an expense category, payment mode, and an amount greater than zero.");
    try {
      setSubmitting(true);
      await updateExpense(expenseId, { ...form, amount: Number(form.amount), gstPercentage: Number(form.gstPercentage || 0), client: form.client || null, employee: form.employee || null });
      if (receipt) await uploadExpenseReceipt(expenseId, receipt);
      toast.success("Expense updated successfully.");
      navigate(`/dashboard/expenses/${expenseId}`);
    } catch (error) { toast.error(error?.response?.data?.message || "Unable to update expense."); }
    finally { setSubmitting(false); }
  };

  return <DashboardLayout><div className="expenses-page new-expense-page"><header className="expenses-header"><div className="new-expense-heading"><button type="button" className="expense-back-button" onClick={() => navigate(`/dashboard/expenses/${expenseId}`)}><ArrowLeft size={18} /> Back to expense details</button><p className="expenses-eyebrow">Expense register</p><h1>Edit Expense</h1><span>The expense number is preserved when you save changes.</span></div></header><form className="new-expense-form" onSubmit={submit}><section className="new-expense-panel"><div className="new-expense-panel-title"><ReceiptText size={19} /><div><h2>Expense details</h2><p>Update the expense information below.</p></div></div><div className="new-expense-grid"><label>Expense date *<span className="new-expense-input-icon"><CalendarDays size={16} /><input type="date" value={form.expenseDate} onChange={(e) => setField("expenseDate", e.target.value)} required /></span></label><label>Expense category *<input value={form.category} onChange={(e) => setField("category", e.target.value)} required /></label><label>Vendor<input value={form.vendor} onChange={(e) => setField("vendor", e.target.value)} /></label><label>Client <em>(optional)</em><select value={form.client} onChange={(e) => setField("client", e.target.value)}><option value="">No client linked</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.clientName || client.clientCode}</option>)}</select></label><label>Employee<select value={form.employee} onChange={(e) => setField("employee", e.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name || employee.email}</option>)}</select></label><label>Payment mode *<select value={form.paymentMode} onChange={(e) => setField("paymentMode", e.target.value)} required><option>UPI</option><option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Card</option><option>Net Banking</option></select></label></div></section><section className="new-expense-panel"><div className="new-expense-panel-title"><span className="new-expense-rupee">₹</span><div><h2>Amount and tax</h2><p>GST and total update automatically.</p></div></div><div className="new-expense-grid new-expense-grid--amounts"><label>Amount *<span className="new-expense-prefix"><b>₹</b><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setField("amount", e.target.value)} required /></span></label><label>GST %<span className="new-expense-suffix"><input type="number" min="0" step="0.01" value={form.gstPercentage} onChange={(e) => setField("gstPercentage", e.target.value)} /><b>%</b></span></label><label>GST amount<span className="new-expense-prefix is-calculated"><b>₹</b><input readOnly value={totals.gstAmount.toFixed(2)} /></span></label><label>Total amount<span className="new-expense-prefix is-calculated"><b>₹</b><input readOnly value={totals.totalAmount.toFixed(2)} /></span></label></div></section><section className="new-expense-panel new-expense-panel--supporting"><div className="new-expense-panel-title"><FileUp size={19} /><div><h2>Remarks and receipt</h2><p>{existingReceipt ? "Uploading a file will replace the current receipt." : "Attach an optional supporting receipt."}</p></div></div><div className="new-expense-support-grid"><label className="new-expense-remarks">Remarks<textarea rows="5" value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} /></label><div><span className="new-expense-label">Replace receipt</span><label className="expense-dropzone"><input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(e) => selectReceipt(e.target.files?.[0])} /><FileUp size={22} /><strong>{receipt ? receipt.name : existingReceipt ? "Choose a new receipt" : "Choose a receipt"}</strong><small>PDF, PNG, JPG or JPEG · up to 15 MB</small></label>{receipt && <button type="button" className="expense-remove-file" onClick={() => setReceipt(null)}><X size={14} /> Keep current receipt</button>}</div></div></section><footer className="new-expense-actions"><button type="button" className="expense-cancel-button" onClick={() => navigate(`/dashboard/expenses/${expenseId}`)}>Cancel</button><button type="submit" className="expense-save-button" disabled={submitting}><Save size={17} /> {submitting ? "Saving…" : "Save changes"}</button></footer></form></div></DashboardLayout>;
};

export default EditExpensePage;

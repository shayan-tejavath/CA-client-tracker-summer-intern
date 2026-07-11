import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileUp, ReceiptText, Save, X } from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { createExpense, uploadExpenseReceipt } from "../../services/expenseService.js";
import "../../styles/expenses.css";

const today = new Date().toISOString().slice(0, 10);
const allowedReceiptTypes = ["application/pdf", "image/png", "image/jpeg"];

const initialForm = {
  expenseDate: today,
  category: "",
  vendor: "",
  client: "",
  employee: "",
  paymentMode: "UPI",
  amount: "",
  gstPercentage: "0",
  remarks: "",
};

const getList = (response, keys) => {
  if (Array.isArray(response)) return response;
  for (const key of keys) if (Array.isArray(response?.[key])) return response[key];
  return [];
};

const NewExpensePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [clientsResponse, employeesResponse] = await Promise.all([
          getClients({ limit: 100 }),
          getEmployees(),
        ]);
        setClients(getList(clientsResponse, ["clients", "data"]));
        setEmployees(getList(employeesResponse, ["employees", "data"]));
      } catch {
        toast.error("Unable to load client or employee options.");
      }
    };
    loadOptions();
  }, []);

  const totals = useMemo(() => {
    const amount = Math.max(Number(form.amount) || 0, 0);
    const gstPercentage = Math.max(Number(form.gstPercentage) || 0, 0);
    const gstAmount = (amount * gstPercentage) / 100;
    return { gstAmount, totalAmount: amount + gstAmount };
  }, [form.amount, form.gstPercentage]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const selectReceipt = (file) => {
    if (!file) return setReceipt(null);
    if (!allowedReceiptTypes.includes(file.type)) {
      toast.error("Receipt must be a PDF, PNG, JPG, or JPEG file.");
      return;
    }
    setReceipt(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.category.trim() || !form.paymentMode || Number(form.amount) <= 0) {
      toast.error("Enter an expense category, payment mode, and an amount greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      const expense = await createExpense({
        ...form,
        amount: Number(form.amount),
        gstPercentage: Number(form.gstPercentage || 0),
        client: form.client || null,
        employee: form.employee || null,
      });
      if (receipt) await uploadExpenseReceipt(expense._id, receipt);
      toast.success("Expense created successfully.");
      navigate("/dashboard/expenses");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to create expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="expenses-page new-expense-page">
        <header className="expenses-header">
          <div className="new-expense-heading">
            <button type="button" className="expense-back-button" onClick={() => navigate("/dashboard/expenses")}><ArrowLeft size={18} /> Back to expenses</button>
            <p className="expenses-eyebrow">Expense register</p>
            <h1>New Expense</h1>
            <span>Record a business expense and attach its supporting receipt.</span>
          </div>
        </header>

        <form className="new-expense-form" onSubmit={handleSubmit}>
          <section className="new-expense-panel">
            <div className="new-expense-panel-title"><ReceiptText size={19} /><div><h2>Expense details</h2><p>Fields marked with * are required.</p></div></div>
            <div className="new-expense-grid">
              <label>Expense date *<span className="new-expense-input-icon"><CalendarDays size={16} /><input type="date" value={form.expenseDate} onChange={(e) => updateField("expenseDate", e.target.value)} required /></span></label>
              <label>Expense category *<input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="e.g. Travel, Office supplies" required /></label>
              <label>Vendor<input value={form.vendor} onChange={(e) => updateField("vendor", e.target.value)} placeholder="Vendor or merchant name" /></label>
              <label>Client <em>(optional)</em><select value={form.client} onChange={(e) => updateField("client", e.target.value)}><option value="">No client linked</option>{clients.map((client) => <option value={client._id} key={client._id}>{client.clientName || client.name || client.clientCode}</option>)}</select></label>
              <label>Employee<select value={form.employee} onChange={(e) => updateField("employee", e.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option value={employee._id} key={employee._id}>{employee.name || employee.email}</option>)}</select></label>
              <label>Payment mode *<select value={form.paymentMode} onChange={(e) => updateField("paymentMode", e.target.value)} required><option>UPI</option><option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Card</option><option>Net Banking</option></select></label>
            </div>
          </section>

          <section className="new-expense-panel">
            <div className="new-expense-panel-title"><span className="new-expense-rupee">₹</span><div><h2>Amount and tax</h2><p>GST and total are calculated automatically.</p></div></div>
            <div className="new-expense-grid new-expense-grid--amounts">
              <label>Amount *<span className="new-expense-prefix"><b>₹</b><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} placeholder="0.00" required /></span></label>
              <label>GST %<span className="new-expense-suffix"><input type="number" min="0" step="0.01" value={form.gstPercentage} onChange={(e) => updateField("gstPercentage", e.target.value)} /><b>%</b></span></label>
              <label>GST amount<span className="new-expense-prefix is-calculated"><b>₹</b><input value={totals.gstAmount.toFixed(2)} readOnly /></span></label>
              <label>Total amount<span className="new-expense-prefix is-calculated"><b>₹</b><input value={totals.totalAmount.toFixed(2)} readOnly /></span></label>
            </div>
          </section>

          <section className="new-expense-panel new-expense-panel--supporting">
            <div className="new-expense-panel-title"><FileUp size={19} /><div><h2>Remarks and receipt</h2><p>Add a note and an optional supporting document.</p></div></div>
            <div className="new-expense-support-grid">
              <label className="new-expense-remarks">Remarks<textarea value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} placeholder="Add any relevant notes about this expense..." rows="5" /></label>
              <div><span className="new-expense-label">Receipt upload</span><label className="expense-dropzone"><input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(e) => selectReceipt(e.target.files?.[0])} /><FileUp size={22} /><strong>{receipt ? receipt.name : "Choose a receipt"}</strong><small>PDF, PNG, JPG or JPEG · up to 15 MB</small></label>{receipt && <button type="button" className="expense-remove-file" onClick={() => setReceipt(null)}><X size={14} /> Remove file</button>}</div>
            </div>
          </section>

          <footer className="new-expense-actions"><button type="button" className="expense-cancel-button" onClick={() => navigate("/dashboard/expenses")}>Cancel</button><button type="submit" className="expense-save-button" disabled={submitting}><Save size={17} /> {submitting ? "Saving…" : "Save expense"}</button></footer>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewExpensePage;

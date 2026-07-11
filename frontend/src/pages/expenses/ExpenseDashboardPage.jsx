import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Clock3, Landmark, RefreshCw, WalletCards } from "lucide-react";
import { toast } from "react-toastify";
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getExpenseDashboard } from "../../services/expenseService.js";
import "../../styles/expenses.css";

const palette = ["#2676c9", "#22a47a", "#7b5ac5", "#e5a638", "#db6d72", "#45a2b8", "#6e859f"];
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const tooltipStyle = { border: "1px solid #e0e7ef", borderRadius: 8, boxShadow: "0 8px 20px rgba(30,55,90,.1)" };

const MetricCard = ({ label, value, icon: Icon, tone, isCurrency = false }) => <article className={`expense-dashboard-metric expense-dashboard-metric--${tone}`}><span><Icon size={20} /></span><div><p>{label}</p><strong>{isCurrency ? formatCurrency(value) : Number(value || 0).toLocaleString("en-IN")}</strong></div></article>;

const ExpenseDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadDashboard = async () => {
    try { setLoading(true); setData(await getExpenseDashboard()); }
    catch (error) { toast.error(error?.response?.data?.message || "Unable to load expense dashboard."); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadDashboard(); }, []);
  const summary = data?.summary || {};

  return <DashboardLayout><div className="expenses-page expense-dashboard-page"><header className="expense-dashboard-header"><div><button type="button" className="expense-back-button" onClick={() => navigate("/dashboard/expenses")}><ArrowLeft size={18} /> Back to expenses</button><p className="expenses-eyebrow">Expense analytics</p><h1>Expense Dashboard</h1><span>Monitor spending, approvals, and vendor patterns at a glance.</span></div><button type="button" className="expenses-refresh" onClick={loadDashboard} disabled={loading}><RefreshCw size={16} className={loading ? "expense-spin" : ""} /> Refresh</button></header>{loading ? <div className="expense-dashboard-loading">Loading dashboard…</div> : <><section className="expense-dashboard-metrics"><MetricCard label="Total Expenses" value={summary.totalExpenses} icon={WalletCards} tone="blue" isCurrency /><MetricCard label="Monthly Expenses" value={summary.monthlyExpenses} icon={CalendarDays} tone="purple" isCurrency /><MetricCard label="Pending" value={summary.pending} icon={Clock3} tone="amber" /><MetricCard label="Approved" value={summary.approved} icon={BadgeCheck} tone="violet" /><MetricCard label="Paid" value={summary.paid} icon={CheckCircle2} tone="green" /></section><section className="expense-dashboard-grid"><article className="expense-chart-card expense-chart-card--wide"><header><div><h2>Monthly Expense Trend</h2><p>Expense totals across the last six months</p></div></header><div className="expense-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}><defs><linearGradient id="expenseTrend" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#2477c9" stopOpacity={.28} /><stop offset="95%" stopColor="#2477c9" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} /><Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} /><Area type="monotone" dataKey="amount" name="Expenses" stroke="#2477c9" strokeWidth={3} fill="url(#expenseTrend)" /></AreaChart></ResponsiveContainer></div></article><article className="expense-chart-card"><header><div><h2>Category-wise Expenses</h2><p>Spend by category</p></div></header><div className="expense-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.categories || []} layout="vertical" margin={{ top: 6, right: 10, left: 5, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fill: "#637187", fontSize: 11 }} /><Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} /><Bar dataKey="amount" name="Expenses" radius={[0, 5, 5, 0]} fill="#22a47a" /></BarChart></ResponsiveContainer></div></article><article className="expense-chart-card"><header><div><h2>Payment Mode Distribution</h2><p>Expense value by payment method</p></div></header><div className="expense-pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.paymentModes || []} dataKey="amount" nameKey="name" innerRadius={53} outerRadius={77} paddingAngle={3}>{(data?.paymentModes || []).map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} /></PieChart></ResponsiveContainer></div></article><article className="expense-chart-card expense-vendor-card"><header><div><h2>Top Vendors</h2><p>Highest spend by vendor</p></div><Landmark size={19} /></header><div className="expense-vendor-list">{(data?.topVendors || []).length ? data.topVendors.map((vendor, index) => <div key={vendor.name}><span className="expense-vendor-rank">{String(index + 1).padStart(2, "0")}</span><strong>{vendor.name}</strong><small>{vendor.count} expense{vendor.count === 1 ? "" : "s"}</small><b>{formatCurrency(vendor.amount)}</b></div>) : <p>No vendor spending recorded yet.</p>}</div></article></section></>}</div></DashboardLayout>;
};

export default ExpenseDashboardPage;

import Client from "../models/Client.js";
import Invoice from "../models/Invoice.js";
import Service from "../models/Service.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { getCompanyFilter } from "../utils/companyScope.js";

const formatCurrency = (value) => {
  const safeValue = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeValue);
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const companyMatch = getCompanyFilter(req);

    const [
      totalClients,
      totalEmployees,
      pendingTasks,
      activeServices,
      revenueResult,
    ] = await Promise.all([
      Client.countDocuments(companyMatch),
      User.countDocuments({ ...companyMatch, role: "Employee" }),
      Task.countDocuments({ ...companyMatch, status: "Pending" }),
      Service.countDocuments(companyMatch),
      Invoice.aggregate([
        { $match: companyMatch },
        { $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } },
      ]),
    ]);

    const revenue = revenueResult?.[0]?.totalRevenue ?? 0;

    res.json({
      totalClients,
      totalEmployees,
      pendingTasks,
      activeServices,
      revenue,
      revenueDisplay: revenue > 0 ? formatCurrency(revenue) : "Not available",
      hasRevenue: revenue > 0,
    });
  } catch (error) {
    next(error);
  }
};

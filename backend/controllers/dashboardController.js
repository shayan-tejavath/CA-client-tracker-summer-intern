import Client from "../models/Client.js";
import Document from "../models/Document.js";
import DscRecord from "../models/DscRecord.js";
import Task from "../models/Task.js";
import TaskDocumentRequest from "../models/TaskDocumentRequest.js";
import User from "../models/User.js";

const formatMonth = (date) => {
  const month = date.getMonth() + 1;
  return `${date.getFullYear()}-${month < 10 ? `0${month}` : month}`;
};

const buildMonthSeries = (months) => months.map((month) => ({ month, total: 0, Pending: 0, "In Progress": 0, Completed: 0, Overdue: 0 }));

const getDscDocumentFilter = (dateFilter = {}) => ({
  isArchived: false,
  expiryDate: {
    $ne: null,
    ...dateFilter,
  },
  $or: [
    { category: { $in: ["DSC", "Digital Signature"] } },
    { tags: { $in: [/^dsc$/i, /digital signature/i, /digital sign/i] } },
    { originalFileName: /dsc|digital sign/i },
    { description: /dsc|digital sign/i },
  ],
});

export const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const dscRenewalWindowDays =
      Number(process.env.DSC_RENEWAL_NOTICE_DAYS) > 0
        ? Number(process.env.DSC_RENEWAL_NOTICE_DAYS)
        : 30;
    const dscRenewalWindowDate = new Date(now);
    dscRenewalWindowDate.setDate(
      dscRenewalWindowDate.getDate() + dscRenewalWindowDays
    );
    const monthWindow = 6;
    const startMonth = new Date(now.getFullYear(), now.getMonth() - (monthWindow - 1), 1);
    const months = Array.from({ length: monthWindow }, (_, idx) => {
      const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + idx, 1);
      return formatMonth(date);
    });

    const clientsPromise = Client.aggregate([{ $count: "totalClients" }]);

    const tasksPromise = Task.aggregate([
      {
        $facet: {
          totalTasks: [{ $count: "count" }],
          completedTasks: [
            { $match: { status: "Completed" } },
            { $count: "count" },
          ],
          pendingTasks: [
            { $match: { status: "Pending" } },
            { $count: "count" },
          ],
          overdueTasks: [
            { $match: { status: "Overdue" } },
            { $count: "count" },
          ],
          monthlyTaskTrend: [
            { $match: { createdAt: { $gte: startMonth } } },
            {
              $group: {
                _id: {
                  month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                  status: "$status",
                },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                month: "$_id.month",
                status: "$_id.status",
                count: 1,
              },
            },
            { $sort: { month: 1 } },
          ],
        },
      },
      {
        $project: {
          totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
          completedTasks: { $arrayElemAt: ["$completedTasks.count", 0] },
          pendingTasks: { $arrayElemAt: ["$pendingTasks.count", 0] },
          overdueTasks: { $arrayElemAt: ["$overdueTasks.count", 0] },
          monthlyTaskTrend: 1,
        },
      },
    ]);

    const clientGrowthPromise = Client.aggregate([
      { $match: { createdAt: { $gte: startMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, month: "$_id", newClients: "$count" } },
      { $sort: { month: 1 } },
    ]);

    const employeesPromise = User.aggregate([
      { $match: { role: "Employee" } },
      { $count: "totalEmployees" },
    ]);

    const recentDocumentsPromise = Document.find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("uploadedBy", "name role")
      .populate("client", "clientName");

    const documentsDashboardPromise = Promise.all([
      Document.countDocuments({ isArchived: false }),
      Document.countDocuments({ isArchived: false, status: "Pending Review" }),
      Promise.all([
        DscRecord.countDocuments({
          expiryDate: { $gte: now, $lte: dscRenewalWindowDate },
        }),
        Document.countDocuments(
          getDscDocumentFilter({
            $gte: now,
            $lte: dscRenewalWindowDate,
          })
        ),
      ]),
      Promise.all([
        DscRecord.countDocuments({ expiryDate: { $lt: now } }),
        Document.countDocuments(getDscDocumentFilter({ $lt: now })),
      ]),
      TaskDocumentRequest.countDocuments({ status: "Pending" }),
      TaskDocumentRequest.countDocuments({ status: "Uploaded" }),
      TaskDocumentRequest.find({})
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate({
          path: "task",
          select: "title status dueDate client assignedTo",
          populate: [
            { path: "client", select: "clientName" },
            { path: "assignedTo", select: "name" },
          ],
        })
        .populate("requestedBy", "name role")
        .populate("uploadedBy", "name role"),
    ]);

    const [
      clientResult,
      taskResult,
      clientGrowthResult,
      employeeResult,
      recentDocuments,
      documentsDashboardResult,
    ] = await Promise.all([
      clientsPromise,
      tasksPromise,
      clientGrowthPromise,
      employeesPromise,
      recentDocumentsPromise,
      documentsDashboardPromise,
    ]);

    const [
      totalDocuments,
      pendingReviewDocuments,
      dscExpiringSoonResult,
      dscExpiredResult,
      pendingDocumentRequests,
      uploadedDocumentRequests,
      recentDocumentRequests,
    ] = documentsDashboardResult;

    const dscExpiringSoon = dscExpiringSoonResult.reduce(
      (sum, count) => sum + count,
      0
    );
    const dscExpired = dscExpiredResult.reduce((sum, count) => sum + count, 0);

    const recentClients = await Client.find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .select("clientName createdAt");

    const recentTasks = await Task.find({})
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate("client", "clientName")
      .populate("assignedTo", "name");

    const events = [];

    recentTasks.forEach((task) => {
      const action = task.status === "Completed" ? "Completed task" : task.status === "Overdue" ? "Marked overdue" : task.updatedAt.getTime() !== task.createdAt.getTime() ? "Updated task" : "Created task";
      events.push({
        type: "Task",
        action,
        title: task.title,
        subject: task.client?.clientName || "Client",
        actor: task.assignedTo?.name || "Team member",
        status: task.status,
        date: task.updatedAt?.toISOString() || task.createdAt.toISOString(),
      });
    });

    recentClients.forEach((client) => {
      events.push({
        type: "Client",
        action: "New client added",
        title: client.clientName,
        subject: "Client profile",
        actor: "System",
        status: "Added",
        date: client.createdAt.toISOString(),
      });
    });

    recentDocuments.forEach((document) => {
      events.push({
        type: "Document",
        action: "Uploaded document",
        title: document.fileName,
        subject: document.client?.clientName || "Client",
        actor: document.uploadedBy?.name || document.uploadedBy?.role || "User",
        status: "Uploaded",
        date: document.createdAt.toISOString(),
      });
    });

    const recentActivities = events
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    const trendIndex = buildMonthSeries(months).reduce((acc, monthObj) => {
      acc[monthObj.month] = monthObj;
      return acc;
    }, {});

    taskResult[0]?.monthlyTaskTrend?.forEach((item) => {
      if (!trendIndex[item.month]) {
        trendIndex[item.month] = { month: item.month, total: 0, Pending: 0, "In Progress": 0, Completed: 0, Overdue: 0 };
      }
      trendIndex[item.month].total += item.count;
      trendIndex[item.month][item.status] = item.count;
    });

    const monthlyTaskTrend = months.map((month) => trendIndex[month]);

    const growthIndex = months.reduce((acc, month) => {
      acc[month] = { month, newClients: 0 };
      return acc;
    }, {});
    clientGrowthResult.forEach((item) => {
      if (growthIndex[item.month]) {
        growthIndex[item.month].newClients = item.newClients;
      }
    });
    const clientGrowthMetrics = months.map((month) => growthIndex[month]);

    res.json({
      totalClients: clientResult[0]?.totalClients || 0,
      totalTasks: taskResult[0]?.totalTasks || 0,
      completedTasks: taskResult[0]?.completedTasks || 0,
      pendingTasks: taskResult[0]?.pendingTasks || 0,
      overdueTasks: taskResult[0]?.overdueTasks || 0,
      totalEmployees: employeeResult[0]?.totalEmployees || 0,
      documentsDashboard: {
        totalDocuments,
        pendingReviewDocuments,
        docInOutOpen: Math.max(totalDocuments - pendingReviewDocuments, 0),
        dscExpiringSoon,
        dscExpired,
        pendingDocumentRequests,
        uploadedDocumentRequests,
        renewalWindowDays: dscRenewalWindowDays,
        recentRequests: recentDocumentRequests.map((request) => ({
          _id: request._id,
          taskId: request.task?._id,
          clientName: request.task?.client?.clientName || "Client",
          taskTitle: request.task?.title || "Task",
          assignedTo: request.task?.assignedTo?.name || "Unassigned",
          status: request.status,
          requestedDocuments: request.requiredDocuments || [],
          uploadedAt: request.uploadedAt,
          updatedAt: request.updatedAt,
        })),
      },
      monthlyTaskTrend,
      clientGrowthMetrics,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

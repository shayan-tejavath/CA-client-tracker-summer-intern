import Task from "../models/Task.js";
import Client from "../models/Client.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import ExcelJS from "exceljs";
import { Parser } from "json2csv";

/**
 * GET /api/reports/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();

    const activeClients = await Client.countDocuments({
      status: "Active",
    });

    const totalTasks = await Task.countDocuments();

    const completedTasks = await Task.countDocuments({
      status: "Completed",
    });

    const pendingTasks = await Task.countDocuments({
      status: {
        $in: ["Pending", "In Progress"],
      },
    });

    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: "Completed" },
    });

    const totalEmployees = await User.countDocuments({
      role: {
        $in: ["Employee", "Manager", "Partner"],
      },
    });

    const taskStatusAgg = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const taskStatusData = taskStatusAgg.map((item) => ({
      name: item._id || "Unknown",
      value: item.value,
    }));

    const taskPriorityAgg = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const taskPriorityData = taskPriorityAgg.map((item) => ({
      priority: item._id || "Unknown",
      count: item.count,
    }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const clientGrowthAgg = await Client.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const clientGrowthData = clientGrowthAgg.map((item) => ({
      month: `${String(item._id.month).padStart(2, "0")}/${item._id.year}`,
      clients: item.count,
    }));

    const monthlyTasksAgg = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const monthlyTasksData = monthlyTasksAgg.map((item) => ({
      month: `${String(item._id.month).padStart(2, "0")}/${item._id.year}`,
      tasks: item.count,
    }));

    res.status(200).json({
      totalClients,
      activeClients,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      totalEmployees,
      taskStatusData,
      taskPriorityData,
      clientGrowthData,
      monthlyTasksData,
    });
  } catch (error) {
    console.error("Analytics Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load analytics",
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/tasks
 */
export const getTaskReports = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("client", "clientName")
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map((task) => ({
      id: task._id,

      task: task.title || "-",

      period: task.recurrence || "One Time",

      date: task.createdAt,

      client: task.client?.clientName || "-",

      targetDate: task.dueDate,

      assignedTo: task.assignedTo?.name || "-",

      priority: task.priority || "-",

      status: task.status || "-",
    }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error("Task Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch task reports",
      error: error.message,
    });
  }
};
/**
 * GET /api/reports/clients
 */
export const getClientReports = async (req, res) => {
  try {
    const clients = await Client.find()
      .populate("assignedManager", "name email role")
      .populate("assignedServices", "serviceCategory subService")
      .sort({ createdAt: -1 });

    const formattedClients = clients.map((client) => ({
      id: client._id,

      client: client.clientName || "-",

      type: client.clientType || "-",

      status: client.status || "-",

      joinedDate: client.createdAt,

      assignedServices:
        client.assignedServices?.map(
          (service) =>
            `${service.serviceCategory} - ${service.subService}`
        ) || [],

      manager: client.assignedManager?.name || "-",

      email: client.email || "-",
    }));

    res.status(200).json(formattedClients);
  } catch (error) {
    console.error("Client Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch client reports",
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/services
 */
export const getServiceReports = async (req, res) => {
  try {
    const services = await Service.find().sort({
      serviceCategory: 1,
      subService: 1,
    });

    const formattedServices = await Promise.all(
      services.map(async (service) => {
        const clientCount = await Client.countDocuments({
          assignedServices: service._id,
        });

        return {
          id: service._id,

          serviceCategory: service.serviceCategory || "-",

          subService: service.subService || "-",

          frequency: service.frequency || "-",

          clientCount,

          description: service.description || "-",
        };
      })
    );

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Service Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch service reports",
      error: error.message,
    });
  }
};

/**
 * GET /api/reports/employees
 */
export const getEmployeeReports = async (req, res) => {
  try {
    const employees = await User.find({
      role: {
        $in: ["Employee", "Manager", "Partner"],
      },
    }).sort({ name: 1 });

    const employeeReports = await Promise.all(
      employees.map(async (employee) => {
        const assignedTasks = await Task.countDocuments({
          assignedTo: employee._id,
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: employee._id,
          status: "Completed",
        });

        const pendingTasks = await Task.countDocuments({
          assignedTo: employee._id,
          status: {
            $in: ["Pending", "In Progress"],
          },
        });

        const overdueTasks = await Task.countDocuments({
          assignedTo: employee._id,
          dueDate: { $lt: new Date() },
          status: { $ne: "Completed" },
        });

        const completionRate =
          assignedTasks > 0
            ? Math.round((completedTasks / assignedTasks) * 100)
            : 0;

        return {
          id: employee._id,

          employee: employee.name,

          role: employee.role,

          assignedTasks,

          completedTasks,

          pendingTasks,

          overdueTasks,

          completionRate,
        };
      })
    );

    res.status(200).json(employeeReports);
  } catch (error) {
    console.error("Employee Reports Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee reports",
      error: error.message,
    });
  }
};
/**
 * GET /api/reports/export/:type?format=csv|xlsx
 */
export const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || "xlsx";

    let data = [];

    switch (type) {
      case "tasks":
        {
          const tasks = await Task.find()
            .populate("client", "clientName")
            .populate("assignedTo", "name");

          data = tasks.map((task) => ({
            Task: task.title,
            Client: task.client?.clientName || "-",
            AssignedTo: task.assignedTo?.name || "-",
            Priority: task.priority,
            Status: task.status,
            DueDate: task.dueDate,
          }));
        }
        break;

      case "clients":
        {
          const clients = await Client.find();

          data = clients.map((client) => ({
            Client: client.clientName,
            Type: client.clientType,
            Status: client.status,
            Email: client.email,
            Mobile: client.mobile,
          }));
        }
        break;

      case "services":
        {
          const services = await Service.find();

          data = services.map((service) => ({
            ServiceCategory: service.serviceCategory,
            SubService: service.subService,
            Frequency: service.frequency,
            Description: service.description,
          }));
        }
        break;

      case "employees":
        {
          const employees = await User.find({
            role: {
              $in: ["Employee", "Manager", "Partner"],
            },
          });

          data = employees.map((employee) => ({
            Name: employee.name,
            Email: employee.email,
            Role: employee.role,
            Active: employee.isActive ? "Yes" : "No",
          }));
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    // =====================
    // CSV EXPORT
    // =====================

    if (format === "csv") {
      const parser = new Parser();

      const csv = parser.parse(data);

      res.header(
        "Content-Disposition",
        `attachment; filename=${type}-report.csv`
      );

      res.header("Content-Type", "text/csv");

      return res.send(csv);
    }

    // =====================
    // EXCEL EXPORT
    // =====================

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Report");

    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key,
        width: 25,
      }));

      worksheet.addRows(data);
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report.xlsx`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("Export Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message,
    });
  }
};
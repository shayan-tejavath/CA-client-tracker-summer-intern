import Client from "../models/Client.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Document from "../models/Document.js";

export const getReportsAnalytics = async (
  req,
  res,
  next
) => {
  try {
    const totalClients =
      await Client.countDocuments();

    const totalTasks =
      await Task.countDocuments();

    const completedTasks =
      await Task.countDocuments({
        status: "Completed",
      });

    const pendingTasks =
      await Task.countDocuments({
        status: "Pending",
      });

    const overdueTasks =
      await Task.countDocuments({
        status: "Overdue",
      });

    const totalEmployees =
      await User.countDocuments({
        role: "Employee",
      });

    const totalDocuments =
      await Document.countDocuments();

    // ===============================
    // TASK STATUS DISTRIBUTION
    // ===============================

    const taskStatusData =
      await Task.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
      ]);

    // ===============================
    // PRIORITY ANALYTICS
    // ===============================

    const priorityData =
      await Task.aggregate([
        {
          $group: {
            _id: "$priority",
            total: { $sum: 1 },
          },
        },
      ]);

    // ===============================
    // CLIENT GROWTH
    // ===============================

    const clientGrowth =
      await Client.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },

            total: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // ===============================
    // MONTHLY TASKS
    // ===============================

    const monthlyTasks =
      await Task.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },

            total: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    res.json({
      overview: {
        totalClients,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalEmployees,
        totalDocuments,
      },

      taskStatusData,

      priorityData,

      clientGrowth,

      monthlyTasks,
    });
  } catch (error) {
    next(error);
  }
};
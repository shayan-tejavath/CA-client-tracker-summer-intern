import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

const OVERDUE_STATUS = "Overdue";
const SKIPPED_STATUSES = ["Completed", OVERDUE_STATUS];

export const findOverdueTasks = async () => {
  const now = new Date();
  return Task.find({
    dueDate: { $lt: now },
    status: { $nin: SKIPPED_STATUSES },
  })
    .populate("assignedTo", "name email role")
    .populate("client", "clientName")
    .populate("service", "serviceCategory subService");
};

export const markTasksAsOverdue = async (taskIds) => {
  if (!taskIds.length) return 0;
  const result = await Task.updateMany(
    { _id: { $in: taskIds }, status: { $nin: SKIPPED_STATUSES } },
    { status: OVERDUE_STATUS }
  );
  return result.modifiedCount || 0;
};

export const logReminderForTask = async (task) => {
  const taskName = task.title || task._id;
  const employeeName = task.assignedTo?.name || "Assigned user";
  const clientName = task.client?.clientName || "Client";
  const serviceName = task.service ? `${task.service.serviceCategory} / ${task.service.subService}` : "Service";
  const message = `Task reminder: "${taskName}" is overdue. Assigned to ${employeeName}. Client: ${clientName}, Service: ${serviceName}.`;

  console.log(`[TaskReminder] ${new Date().toISOString()} - ${message}`);

  if (task.assignedTo?._id) {
    await Notification.create({
      title: "Overdue task reminder",
      message,
      user: task.assignedTo._id,
    });
  }
};

export const processOverdueTasks = async () => {
  const overdueTasks = await findOverdueTasks();
  if (!overdueTasks.length) {
    console.log(`[TaskReminder] ${new Date().toISOString()} - No overdue tasks found.`);
    return { processed: 0, marked: 0 };
  }

  const taskIds = overdueTasks.map((task) => task._id);
  const markedCount = await markTasksAsOverdue(taskIds);

  await Promise.all(overdueTasks.map((task) => logReminderForTask(task)));

  console.log(
    `[TaskReminder] ${new Date().toISOString()} - Processed ${overdueTasks.length} overdue tasks, marked ${markedCount} tasks as overdue.`
  );

  return { processed: overdueTasks.length, marked: markedCount };
};

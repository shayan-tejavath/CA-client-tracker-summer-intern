import mongoose from "mongoose";

import Task from "../models/Task.js";
import SubTask from "../models/SubTask.js";
import TaskDocument from "../models/TaskDocument.js";
import TaskActivity from "../models/TaskActivity.js";
import TaskDocumentRequest from "../models/TaskDocumentRequest.js";
import Client from "../models/Client.js";
import { ROLES } from "../middleware/roleMiddleware.js";

import {
  notifyTaskAssigned,
  notifyTaskStatusUpdated,
  notifyTaskCompleted,
  notifyTaskCommentAdded,
  notifyClientDocumentUploaded,
} from "../services/notificationService.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const allowedStatuses = ["Pending", "In Progress", "Completed", "Overdue"];
const allowedPriorities = ["Low", "Medium", "High", "Critical"];
const allowedRecurrenceTypes = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

const validateTaskPayload = (data, partial = false) => {
  const requiredFields = ["title", "client", "service", "assignedTo", "dueDate"];
  const missingFields = requiredFields.filter(
    (field) => !partial && (!data[field] || String(data[field]).trim() === "")
  );

  if (missingFields.length) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  if (data.status && !allowedStatuses.includes(data.status)) {
    return `Status must be one of: ${allowedStatuses.join(", ")}`;
  }

  if (data.priority && !allowedPriorities.includes(data.priority)) {
    return `Priority must be one of: ${allowedPriorities.join(", ")}`;
  }

  if (data.recurrence && !allowedRecurrenceTypes.includes(data.recurrence)) {
    return `recurrence must be one of: ${allowedRecurrenceTypes.join(", ")}`;
  }

  if (data.dueDate && Number.isNaN(new Date(data.dueDate).getTime())) {
    return "dueDate must be a valid date";
  }

  return null;
};

const taskPopulate = (query) =>
  query
    .populate("client", "clientName pan gstin email mobile")
    .populate("service", "serviceCategory subService frequency")
    .populate("assignedTo", "name email role")
    .populate("parentTask", "title dueDate status")
    .populate("childTask", "title dueDate status")
    .populate("comments.author", "name email role");

const getAssignedToId = (taskDoc) => {
  if (!taskDoc?.assignedTo) return null;
  if (typeof taskDoc.assignedTo === "object" && taskDoc.assignedTo._id) {
    return taskDoc.assignedTo._id.toString();
  }
  return taskDoc.assignedTo.toString
    ? taskDoc.assignedTo.toString()
    : String(taskDoc.assignedTo);
};

const createTaskActivity = async ({ taskId, activity, userId, companyId, details = "" }) => {
  if (!taskId || !userId) return null;

  return TaskActivity.create({
    companyId,
    task: taskId,
    activity,
    user: userId,
    details: String(details).trim(),
  });
};

const getNextDueDate = (dueDate, recurrenceType) => {
  if (!dueDate || !recurrenceType) return null;

  const currentDate = new Date(dueDate);
  if (Number.isNaN(currentDate.getTime())) return null;

  const nextDate = new Date(currentDate);

  switch (recurrenceType) {
    case "Daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "Weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "Monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "Quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "Yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return nextDate;
};

const createRecurringChildTask = async (parentTask, userId) => {
  if (!parentTask || !parentTask.recurrence) return null;
  if (parentTask.status !== "Completed") return null;
  if (parentTask.childTask) return null;

  const nextDueDate = getNextDueDate(parentTask.dueDate, parentTask.recurrence);
  if (!nextDueDate) return null;

  const childTask = await Task.create({
    companyId: parentTask.companyId || null,
    title: parentTask.title,
    client: parentTask.client,
    service: parentTask.service,
    assignedTo: parentTask.assignedTo,
    status: "Pending",
    priority: parentTask.priority,
    dueDate: nextDueDate,
    description: parentTask.description || "",
    recurrence: parentTask.recurrence,
    parentTask: parentTask._id,
    childTask: null,
  });

  await Task.findByIdAndUpdate(parentTask._id, { childTask: childTask._id });

  try {
    await createTaskActivity({
      taskId: childTask._id,
      activity: "Recurring Task Created",
      userId,
      companyId: parentTask.companyId || null,
      details: parentTask.title,
    });
  } catch (activityError) {
    console.error("Recurring task activity logging failed:", activityError.message);
  }

  return childTask;
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, dueDate, dueBefore, dueAfter } = req.query;
    const query = { ...getCompanyFilter(req) };

    if (status) {
      query.status = status;
    }

    if (dueDate) {
      const exactDate = new Date(dueDate);
      if (!Number.isNaN(exactDate.getTime())) {
        const start = new Date(exactDate.setHours(0, 0, 0, 0));
        const end = new Date(exactDate.setHours(23, 59, 59, 999));
        query.dueDate = { $gte: start, $lte: end };
      }
    }

    if (dueBefore) {
      const before = new Date(dueBefore);
      if (!Number.isNaN(before.getTime())) {
        query.dueDate = { ...query.dueDate, $lt: before };
      }
    }

    if (dueAfter) {
      const after = new Date(dueAfter);
      if (!Number.isNaN(after.getTime())) {
        query.dueDate = { ...query.dueDate, $gt: after };
      }
    }

    if (req.user?.role === ROLES.Employee) {
      query.assignedTo = req.user._id;
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ ...getCompanyFilter(req), email: req.user.email });
      if (!client) {
        return res.status(403).json({ message: "Forbidden" });
      }
      query.client = client._id;
    }

    const tasks = await taskPopulate(
      Task.find(query).sort({ dueDate: 1, priority: -1 })
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const companyFilter = getCompanyFilter(req);
    const task = await taskPopulate(Task.findOne({ _id: id, ...companyFilter }));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user?.role === ROLES.Employee &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ ...getCompanyFilter(req), email: req.user.email });
      if (!client || task.client?.toString() !== client._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const validationError = validateTaskPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const task = await Task.create({
      companyId: getCompanyId(req),
      title: req.body.title,
      client: req.body.client,
      service: req.body.service,
      assignedTo: req.body.assignedTo,
      status: req.body.status || "Pending",
      priority: req.body.priority || "Medium",
      dueDate: req.body.dueDate,
      description: req.body.description || "",
      recurrence: req.body.recurrence || null,
      parentTask: req.body.parentTask || null,
      childTask: req.body.childTask || null,
      comments: req.body.comments || [],
    });

    const createdTask = await taskPopulate(Task.findById(task._id));

    try {
      await createTaskActivity({
        taskId: createdTask._id,
        activity: "Task Created",
        userId: req.user?._id,
        companyId: getCompanyId(req),
        details: createdTask.title,
      });
    } catch (activityError) {
      console.error("Task activity logging failed:", activityError.message);
    }

    try {
      const assignedToId = getAssignedToId(createdTask);
      if (assignedToId) {
        await notifyTaskAssigned({
          userId: assignedToId,
          task: createdTask,
          sender: req.user?._id,
        });
      }
    } catch (err) {
      console.error("Task notification failed:", err.message);
    }

    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const companyFilter = getCompanyFilter(req);
    const task = await Task.findOne({ _id: id, ...companyFilter });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user?.role === ROLES.Client) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === ROLES.Employee) {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const allowedFields = ["status"];
      const disallowedFields = Object.keys(req.body).filter(
        (field) => !allowedFields.includes(field)
      );
      if (disallowedFields.length) {
        return res
          .status(403)
          .json({ message: "Employees may only update task status." });
      }
    }

    const validationError = validateTaskPayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatePayload = {
      ...req.body,
    };

    const updatedTask = await Task.findOneAndUpdate({ _id: id, ...companyFilter }, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const populatedUpdatedTask = await taskPopulate(
      Task.findById(updatedTask._id)
    );

    let createdRecurringChild = null;
    if (
      req.body.status === "Completed" &&
      task.status !== "Completed" &&
      populatedUpdatedTask?.recurrence
    ) {
      try {
        createdRecurringChild = await createRecurringChildTask(
          populatedUpdatedTask,
          req.user?._id
        );
      } catch (recurrenceError) {
        console.error("Recurring task creation failed:", recurrenceError.message);
      }
    }

    /* ===========================================
       TASK REASSIGNED
    =========================================== */

    const assignedToChanged =
      req.body.assignedTo &&
      req.body.assignedTo.toString() !== task.assignedTo?.toString();

    if (assignedToChanged) {
      try {
        await createTaskActivity({
          taskId: populatedUpdatedTask._id,
          activity: "Employee Assigned",
          userId: req.user?._id,
          companyId: getCompanyId(req),
          details: `Assigned to ${populatedUpdatedTask.assignedTo?.name || "employee"}`,
        });
      } catch (activityError) {
        console.error("Task assignment activity logging failed:", activityError.message);
      }

      try {
        const newAssignedToId = getAssignedToId(populatedUpdatedTask);

        if (newAssignedToId) {
          await notifyTaskAssigned({
            userId: newAssignedToId,
            task: populatedUpdatedTask,
            sender: req.user?._id,
          });
        }
      } catch (err) {
        console.error("Task reassignment notification failed:", err.message);
      }
    }

    /* ===========================================
       STATUS CHANGED
    =========================================== */

    if (req.body.status && req.body.status !== task.status) {
      try {
        await createTaskActivity({
          taskId: populatedUpdatedTask._id,
          activity: "Status Changed",
          userId: req.user?._id,
          companyId: getCompanyId(req),
          details: `${task.status || "Pending"} → ${req.body.status}`,
        });
      } catch (activityError) {
        console.error("Task status activity logging failed:", activityError.message);
      }

      try {
        const assignedToId = getAssignedToId(populatedUpdatedTask);

        if (assignedToId) {
          await notifyTaskStatusUpdated({
            userId: assignedToId,
            task: populatedUpdatedTask,
            oldStatus: task.status,
            newStatus: req.body.status,
          });
        }

        if (req.body.status === "Completed") {
          await notifyTaskCompleted({
            userId: assignedToId,
            task: populatedUpdatedTask,
          });
        }
      } catch (err) {
        console.error("Task status notification failed:", err.message);
      }
    }

    res.json(populatedUpdatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const companyFilter = getCompanyFilter(req);
    const task = await Task.findOne({ _id: id, ...companyFilter });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const validateSubTaskPayload = (data, partial = false) => {
  if (!partial && (!data.title || String(data.title).trim() === "")) {
    return "Sub-task title is required";
  }

  if (data.completed !== undefined && typeof data.completed !== "boolean") {
    return "completed must be a boolean";
  }

  return null;
};

const ensureTaskAccess = async (req, task) => {
  if (!task) {
    return { allowed: false, status: 404, message: "Task not found" };
  }

  if (req.user?.role === ROLES.Employee) {
    if (task.assignedTo?.toString() !== req.user._id.toString()) {
      return { allowed: false, status: 403, message: "Forbidden" };
    }
    return { allowed: true };
  }

  if (req.user?.role === ROLES.Client) {
    const client = await Client.findOne({ ...getCompanyFilter(req), email: req.user.email });
    if (!client || task.client?.toString() !== client._id.toString()) {
      return { allowed: false, status: 403, message: "Forbidden" };
    }
  }

  return { allowed: true };
};

export const listSubTasks = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const subTasks = await SubTask.find({ task: taskId, ...getCompanyFilter(req) }).sort({ completed: 1, createdAt: 1 });
    res.json(subTasks);
  } catch (error) {
    next(error);
  }
};

export const createSubTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const validationError = validateSubTaskPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const subTask = await SubTask.create({
      companyId: getCompanyId(req),
      task: taskId,
      title: String(req.body.title).trim(),
      description: req.body.description ? String(req.body.description).trim() : "",
      completed: Boolean(req.body.completed),
    });

    res.status(201).json(subTask);
  } catch (error) {
    next(error);
  }
};

export const updateSubTask = async (req, res, next) => {
  try {
    const { taskId, subTaskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(subTaskId)) {
      return res.status(400).json({ message: "Invalid task or sub-task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const subTask = await SubTask.findOne({ _id: subTaskId, task: taskId, ...getCompanyFilter(req) });
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    const validationError = validateSubTaskPayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatePayload = {};
    if (req.body.title !== undefined) {
      updatePayload.title = String(req.body.title).trim();
    }
    if (req.body.description !== undefined) {
      updatePayload.description = String(req.body.description).trim();
    }
    if (req.body.completed !== undefined) {
      updatePayload.completed = Boolean(req.body.completed);
    }

    const updatedSubTask = await SubTask.findOneAndUpdate({ _id: subTaskId, ...getCompanyFilter(req) }, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.json(updatedSubTask);
  } catch (error) {
    next(error);
  }
};

export const deleteSubTask = async (req, res, next) => {
  try {
    const { taskId, subTaskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(subTaskId)) {
      return res.status(400).json({ message: "Invalid task or sub-task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const subTask = await SubTask.findOne({ _id: subTaskId, task: taskId, ...getCompanyFilter(req) });
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    await subTask.deleteOne();
    res.json({ message: "Sub-task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const listTaskActivities = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const activities = await TaskActivity.find({ task: taskId, ...getCompanyFilter(req) })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    next(error);
  }
};

export const listTaskDocuments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const documents = await TaskDocument.find({ task: taskId, ...getCompanyFilter(req) }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

export const uploadTaskDocument = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const document = await TaskDocument.create({
      companyId: getCompanyId(req),
      task: taskId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/task-documents/${req.file.filename}`,
    });

    const request = await TaskDocumentRequest.findOne({ task: taskId, ...getCompanyFilter(req) }).sort({ createdAt: -1 });
    if (request) {
      request.status = "Uploaded";
      request.uploadedBy = req.user?._id || null;
      request.uploadedAt = new Date();
      await request.save();
    }

    await createTaskActivity({
      taskId,
      activity: "Document Uploaded",
      userId: req.user?._id,
      companyId: getCompanyId(req),
      details: req.file.originalname,
    });

    if (req.user?.role === ROLES.Client && task.assignedTo) {
      try {
        const populatedTask = await Task.findOne({
          _id: taskId,
          ...getCompanyFilter(req),
        })
          .populate("assignedTo", "name email role")
          .populate("client", "clientName");

        await notifyClientDocumentUploaded({
          userId: populatedTask?.assignedTo?._id || task.assignedTo,
          task: populatedTask || task,
          document,
          client: populatedTask?.client,
          sender: req.user?._id,
        });
      } catch (notificationError) {
        console.error(
          "Task document upload notification failed:",
          notificationError.message
        );
      }
    }

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

export const deleteTaskDocument = async (req, res, next) => {
  try {
    const { taskId, documentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: "Invalid task or document ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const document = await TaskDocument.findOne({ _id: documentId, task: taskId, ...getCompanyFilter(req) });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    try {
      await import("fs/promises").then(({ rm }) => rm(document.path.replace(/^\//, ""), { force: true }));
    } catch (fileError) {
      console.error("Task document cleanup failed:", fileError.message);
    }

    await document.deleteOne();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const createTaskDocumentRequest = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { requiredDocuments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const normalizedDocuments = Array.isArray(requiredDocuments)
      ? requiredDocuments.map((document) => String(document).trim()).filter(Boolean)
      : [];

    if (!normalizedDocuments.length) {
      return res.status(400).json({ message: "At least one document is required" });
    }

    const request = await TaskDocumentRequest.findOneAndUpdate(
      { task: taskId, ...getCompanyFilter(req) },
      {
        companyId: getCompanyId(req),
        task: taskId,
        requiredDocuments: normalizedDocuments,
        status: "Pending",
        requestedBy: req.user?._id || null,
        uploadedBy: null,
        uploadedAt: null,
        verifiedAt: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const listTaskDocumentRequests = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: taskId, ...getCompanyFilter(req) });
    const access = await ensureTaskAccess(req, task);
    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message });
    }

    const requests = await TaskDocumentRequest.find({ task: taskId, ...getCompanyFilter(req) }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const listAllTaskDocumentRequests = async (req, res, next) => {
  try {
    const {
      clientId,
      status,
      search,
      page = 1,
      limit = 100,
    } = req.query;

    const taskFilter = { ...getCompanyFilter(req) };

    if (req.user?.role === ROLES.Employee) {
      taskFilter.assignedTo = req.user._id;
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ ...getCompanyFilter(req), email: req.user.email });
      if (!client) {
        return res.status(403).json({ message: "Forbidden" });
      }
      taskFilter.client = client._id;
    } else if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      taskFilter.client = clientId;
    }

    if (search) {
      taskFilter.title = new RegExp(search, "i");
    }

    const taskIds = await Task.find(taskFilter).select("_id");
    const requestFilter = {
      task: { $in: taskIds.map((task) => task._id) },
    };

    if (status && status !== "All") {
      requestFilter.status = status;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const [requests, total] = await Promise.all([
      TaskDocumentRequest.find(requestFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: "task",
          select: "title client assignedTo status dueDate",
          populate: [
            { path: "client", select: "clientName email mobile" },
            { path: "assignedTo", select: "name email role" },
          ],
        })
        .populate("requestedBy", "name role")
        .populate("uploadedBy", "name role"),
      TaskDocumentRequest.countDocuments(requestFilter),
    ]);

    const documentCounts = await TaskDocument.aggregate([
      {
        $match: {
          task: { $in: requests.map((request) => request.task?._id).filter(Boolean) },
        },
      },
      { $group: { _id: "$task", count: { $sum: 1 } } },
    ]);

    const countIndex = documentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    res.json({
      requests: requests.map((request) => ({
        _id: request._id,
        task: request.task,
        requestedBy: request.requestedBy,
        uploadedBy: request.uploadedBy,
        requiredDocuments: request.requiredDocuments,
        status: request.status,
        uploadedAt: request.uploadedAt,
        verifiedAt: request.verifiedAt,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        documentCount: request.task?._id
          ? countIndex[request.task._id.toString()] || 0
          : 0,
      })),
      pagination: {
        total,
        currentPage,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskDocumentRequestStatus = async (req, res, next) => {
  try {
    const { taskId, requestId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const request = await TaskDocumentRequest.findOne({ _id: requestId, task: taskId, ...getCompanyFilter(req) });
    if (!request) {
      return res.status(404).json({ message: "Document request not found" });
    }

    if (status === "Verified") {
      request.status = "Verified";
      request.verifiedAt = new Date();
    } else if (status === "Uploaded") {
      request.status = "Uploaded";
      request.uploadedAt = request.uploadedAt || new Date();
    } else {
      request.status = "Pending";
    }

    await request.save();
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (!text || String(text).trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const task = await Task.findOne({
      _id: id,
      ...getCompanyFilter(req),
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user?.role === ROLES.Employee &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ ...getCompanyFilter(req), email: req.user.email });
      if (!client || task.client?.toString() !== client._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const comment = { author: req.user._id, text: String(text).trim() };
    task.comments.push(comment);
    await task.save();

    try {
      await createTaskActivity({
        taskId: task._id,
        activity: "Comment Added",
        userId: req.user?._id,
        companyId: getCompanyId(req),
        details: String(text).trim(),
      });
    } catch (activityError) {
      console.error("Comment activity logging failed:", activityError.message);
    }

    try {
      const assignedToId = task.assignedTo?.toString();

      if (assignedToId) {
        await notifyTaskCommentAdded({
          userId: assignedToId,
          task,
          comment: text,
          sender: req.user?._id,
        });
      }
    } catch (err) {
      console.error("Comment notification failed:", err.message);
    }

    const populated = await taskPopulate(Task.findById(task._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

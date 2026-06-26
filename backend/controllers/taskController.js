import mongoose from "mongoose";
import Task from "../models/Task.js";
import Client from "../models/Client.js";
import { ROLES } from "../middleware/roleMiddleware.js";
import { notifyTaskAssigned } from "../services/notificationService.js";

const allowedStatuses = ["Pending", "In Progress", "Completed", "Overdue"];
const allowedPriorities = ["Low", "Medium", "High", "Critical"];

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
    .populate("comments.author", "name email role");

const getAssignedToId = (taskDoc) => {
  if (!taskDoc?.assignedTo) return null;
  if (typeof taskDoc.assignedTo === "object" && taskDoc.assignedTo._id) {
    return taskDoc.assignedTo._id.toString();
  }
  return taskDoc.assignedTo.toString ? taskDoc.assignedTo.toString() : String(taskDoc.assignedTo);
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, dueDate, dueBefore, dueAfter } = req.query;
    const query = {};

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
      const client = await Client.findOne({ email: req.user.email });
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

    const task = await taskPopulate(Task.findById(id));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user?.role === ROLES.Employee && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
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
      title: req.body.title,
      client: req.body.client,
      service: req.body.service,
      assignedTo: req.body.assignedTo,
      status: req.body.status || "Pending",
      priority: req.body.priority || "Medium",
      dueDate: req.body.dueDate,
      description: req.body.description || "",
      comments: req.body.comments || [],
    });

    const createdTask = await taskPopulate(Task.findById(task._id));

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

    const task = await Task.findById(id);
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
        return res.status(403).json({ message: "Employees may only update task status." });
      }
    }

    const validationError = validateTaskPayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatePayload = {
      ...req.body,
    };

    const updatedTask = await Task.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const populatedUpdatedTask = await taskPopulate(Task.findById(updatedTask._id));

    const assignedToChanged =
      req.body.assignedTo &&
      req.body.assignedTo.toString() !== task.assignedTo?.toString();

    if (assignedToChanged) {
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

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
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

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user?.role === ROLES.Employee && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
      if (!client || task.client?.toString() !== client._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const comment = { author: req.user._id, text: String(text).trim() };
    task.comments.push(comment);
    await task.save();

    const populated = await taskPopulate(Task.findById(task._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

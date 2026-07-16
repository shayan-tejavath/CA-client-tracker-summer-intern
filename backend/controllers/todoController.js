import mongoose from "mongoose";
import Todo from "../models/Todo.js";

const TODO_STATUSES = ["Pending", "Hold", "In Progress", "Completed"];
const TODO_PRIORITIES = ["Low", "Medium", "High"];

const isValidStatus = (value) => TODO_STATUSES.includes(value);
const isValidPriority = (value) => TODO_PRIORITIES.includes(value);

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const getDateOnlyKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const buildSummary = (todos = []) => {
  const todayKey = getDateOnlyKey(new Date());

  const summary = {
    total: todos.length,
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    statusCounts: {
      Pending: 0,
      Hold: 0,
      "In Progress": 0,
      Completed: 0,
    },
  };

  for (const todo of todos) {
    if (summary.statusCounts[todo.status] !== undefined) {
      summary.statusCounts[todo.status] += 1;
    }

    if (todo.status === "Completed") {
      summary.completedCount += 1;
    }

    if (todo.dueDate) {
      const dueKey = getDateOnlyKey(todo.dueDate);
      if (dueKey === todayKey) {
        summary.todayCount += 1;
      } else if (dueKey > todayKey) {
        summary.upcomingCount += 1;
      }
    }
  }

  return summary;
};

const populateTodo = async (todo) => {
  if (!todo?._id) return todo;
  return Todo.findById(todo._id)
    .populate("assignedTo", "name email role photo")
    .populate("createdBy", "name email role photo");
};

const applyFilters = (todos, filters = {}) => {
  const { tab = "All", status = "All", assignedTo = "", search = "" } = filters;
  const normalizedSearch = normalizeText(search);
  const todayKey = getDateOnlyKey(new Date());

  return todos.filter((todo) => {
    if (status !== "All" && todo.status !== status) {
      return false;
    }

    if (assignedTo && String(todo.assignedTo?._id || todo.assignedTo || "") !== String(assignedTo)) {
      return false;
    }

    if (tab === "Today") {
      const dueKey = todo.dueDate ? getDateOnlyKey(todo.dueDate) : "";
      if (dueKey !== todayKey) return false;
    }

    if (tab === "Upcoming") {
      const dueKey = todo.dueDate ? getDateOnlyKey(todo.dueDate) : "";
      if (!dueKey || dueKey <= todayKey || todo.status === "Completed") return false;
    }

    if (tab === "Completed" && todo.status !== "Completed") {
      return false;
    }

    if (!normalizedSearch) return true;

    const haystack = [
      todo.title,
      todo.details,
      todo.status,
      todo.priority,
      todo.assignedTo?.name,
      todo.assignedTo?.email,
      todo.createdBy?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
};

export const getTodos = async (req, res, next) => {
  try {
    const allTodos = await Todo.find()
      .populate("assignedTo", "name email role photo")
      .populate("createdBy", "name email role photo")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const summary = buildSummary(allTodos);

    const filtered = applyFilters(allTodos, {
      tab: req.query.tab || "All",
      status: req.query.status || "All",
      assignedTo: req.query.assignedTo || "",
      search: req.query.search || "",
    });

    res.json({
      todos: filtered,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodoSummary = async (req, res, next) => {
  try {
    const allTodos = await Todo.find()
      .populate("assignedTo", "name email role photo")
      .populate("createdBy", "name email role photo")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    res.json(buildSummary(allTodos));
  } catch (error) {
    next(error);
  }
};

export const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid To-Do ID" });
    }

    const todo = await Todo.findById(id)
      .populate("assignedTo", "name email role photo")
      .populate("createdBy", "name email role photo");

    if (!todo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    res.json(todo);
  } catch (error) {
    next(error);
  }
};

export const createTodo = async (req, res, next) => {
  try {
    const {
      title,
      details = "",
      dueDate = null,
      assignedTo = null,
      status = "Pending",
      priority = "Medium",
    } = req.body;

    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "To-Do title is required" });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (!isValidPriority(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "Invalid assigned user" });
    }

    const todo = await Todo.create({
      title: title.trim(),
      details: String(details || "").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status,
      priority,
      completedAt: status === "Completed" ? new Date() : null,
    });

    const populated = await populateTodo(todo);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid To-Do ID" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    const {
      title,
      details,
      dueDate,
      assignedTo,
      status,
      priority,
    } = req.body;

    if (typeof title !== "undefined") {
      if (!String(title || "").trim()) {
        return res.status(400).json({ message: "To-Do title is required" });
      }
      todo.title = String(title).trim();
    }

    if (typeof details !== "undefined") {
      todo.details = String(details || "").trim();
    }

    if (typeof dueDate !== "undefined") {
      todo.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (typeof assignedTo !== "undefined") {
      if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: "Invalid assigned user" });
      }
      todo.assignedTo = assignedTo || null;
    }

    if (typeof status !== "undefined") {
      if (!isValidStatus(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      todo.status = status;
      todo.completedAt = status === "Completed" ? todo.completedAt || new Date() : null;
    }

    if (typeof priority !== "undefined") {
      if (!isValidPriority(priority)) {
        return res.status(400).json({ message: "Invalid priority value" });
      }
      todo.priority = priority;
    }

    if (todo.status !== "Completed") {
      todo.completedAt = null;
    }

    await todo.save();

    const populated = await populateTodo(todo);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const toggleTodoStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid To-Do ID" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    todo.status = todo.status === "Completed" ? "Pending" : "Completed";
    todo.completedAt = todo.status === "Completed" ? new Date() : null;

    await todo.save();

    const populated = await populateTodo(todo);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid To-Do ID" });
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    await todo.deleteOne();
    res.json({ message: "To-Do deleted successfully" });
  } catch (error) {
    next(error);
  }
};
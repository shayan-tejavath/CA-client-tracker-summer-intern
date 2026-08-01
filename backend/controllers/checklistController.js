import mongoose from "mongoose";
import Checklist from "../models/Checklist.js";
import Task from "../models/Task.js";
import TaskActivity from "../models/TaskActivity.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const checklistPopulate = (query) =>
  query
    .populate("task", "title client service")
    .populate("createdBy", "name email");

export const getChecklistsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({
      _id: taskId,
      ...getCompanyFilter(req),
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const checklists = await checklistPopulate(
      Checklist.find({ task: taskId, ...getCompanyFilter(req) }).sort({ createdAt: 1 })
    );

    res.json(checklists);
  } catch (error) {
    next(error);
  }
};

export const createChecklist = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ message: "Checklist title is required" });
    }

    const task = await Task.findOne({
      _id: taskId,
      ...getCompanyFilter(req),
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const checklist = new Checklist({
      companyId: getCompanyId(req),
      task: taskId,
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      completed: false,
      createdBy: req.user._id,
    });

    await checklist.save();
    await TaskActivity.create({
      companyId: getCompanyId(req),
      task: taskId,
      activity: "Checklist Updated",
      user: req.user._id,
      details: `Added checklist item: ${checklist.title}`,
    });
    await checklistPopulate(Checklist.findById(checklist._id));
    const populated = await checklistPopulate(Checklist.findById(checklist._id));

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid checklist ID" });
    }

    const checklist = await Checklist.findOne({
      _id: id,
      ...getCompanyFilter(req),
    });
    if (!checklist) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    if (title !== undefined && String(title).trim() !== "") {
      checklist.title = String(title).trim();
    }

    if (description !== undefined) {
      checklist.description = description ? String(description).trim() : "";
    }

    if (completed !== undefined) {
      checklist.completed = Boolean(completed);
    }

    await checklist.save();
    await TaskActivity.create({
      companyId: getCompanyId(req),
      task: checklist.task,
      activity: "Checklist Updated",
      user: req.user._id,
      details: `Updated checklist item: ${checklist.title}`,
    });
    const updated = await checklistPopulate(Checklist.findById(checklist._id));

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid checklist ID" });
    }

    const checklist = await Checklist.findOneAndDelete({
      _id: id,
      ...getCompanyFilter(req),
    });
    if (!checklist) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    await TaskActivity.create({
      companyId: getCompanyId(req),
      task: checklist.task,
      activity: "Checklist Updated",
      user: req.user._id,
      details: `Deleted checklist item: ${checklist.title}`,
    });

    res.json({ message: "Checklist item deleted successfully" });
  } catch (error) {
    next(error);
  }
};

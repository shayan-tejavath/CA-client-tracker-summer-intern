import mongoose from "mongoose";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import Service from "../models/Service.js";

const normalizeTaskDefinitions = (definitions = []) => {
  if (!Array.isArray(definitions)) {
    return [];
  }

  return definitions
    .filter((definition) => definition && String(definition.title || "").trim())
    .map((definition, index) => ({
      title: String(definition.title).trim(),
      description: typeof definition.description === "string" ? String(definition.description).trim() : "",
      priority: ["Low", "Medium", "High", "Critical"].includes(definition.priority)
        ? definition.priority
        : "Medium",
      estimatedDays:
        definition.estimatedDays !== undefined && definition.estimatedDays !== null
          ? Number(definition.estimatedDays)
          : undefined,
      order: Number.isFinite(Number(definition.order)) ? Number(definition.order) : index + 1,
    }))
    .sort((a, b) => a.order - b.order);
};

const validateTemplatePayload = (data) => {
  const errors = [];

  if (!data || !String(data.name || "").trim()) {
    errors.push("Template name is required");
  }

  const definitions = normalizeTaskDefinitions(data?.steps || data?.taskDefinitions);
  if (!definitions.length) {
    errors.push("At least one workflow step is required");
  }

  return errors;
};

export const getWorkflowTemplates = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const templates = await WorkflowTemplate.find({ service: serviceId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const createWorkflowTemplate = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const validationErrors = validateTemplatePayload(req.body);
    if (validationErrors.length) {
      return res.status(400).json({ message: validationErrors[0] });
    }

    const template = await WorkflowTemplate.create({
      name: String(req.body.name).trim(),
      service: serviceId,
      taskDefinitions: normalizeTaskDefinitions(req.body.steps || req.body.taskDefinitions),
      isActive: req.body.isActive !== false,
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

export const updateWorkflowTemplate = async (req, res, next) => {
  try {
    const { serviceId, templateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId) || !mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const validationErrors = validateTemplatePayload(req.body);
    if (validationErrors.length) {
      return res.status(400).json({ message: validationErrors[0] });
    }

    const template = await WorkflowTemplate.findOne({ _id: templateId, service: serviceId });
    if (!template) {
      return res.status(404).json({ message: "Workflow template not found" });
    }

    template.name = String(req.body.name).trim();
    template.taskDefinitions = normalizeTaskDefinitions(req.body.steps || req.body.taskDefinitions);
    template.isActive = req.body.isActive !== false;
    await template.save();

    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflowTemplate = async (req, res, next) => {
  try {
    const { serviceId, templateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId) || !mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const template = await WorkflowTemplate.findOne({ _id: templateId, service: serviceId });
    if (!template) {
      return res.status(404).json({ message: "Workflow template not found" });
    }

    await template.deleteOne();
    res.json({ message: "Workflow template deleted successfully" });
  } catch (error) {
    next(error);
  }
};

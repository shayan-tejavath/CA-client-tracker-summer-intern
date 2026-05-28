import mongoose from "mongoose";
import Service from "../models/Service.js";

const validateService = (data) => {
  const requiredFields = ["serviceCategory", "subService", "frequency"];
  const missingFields = requiredFields.filter(
    (field) => !data[field] || String(data[field]).trim() === ""
  );
  if (missingFields.length) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  const categories = ["GST", "Income Tax", "TDS", "ROC", "Audit"];
  if (!categories.includes(data.serviceCategory)) {
    return `serviceCategory must be one of: ${categories.join(", ")}`;
  }

  return null;
};

export const getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const validationError = validateService(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const service = await Service.create({
      serviceCategory: req.body.serviceCategory,
      subService: req.body.subService,
      frequency: req.body.frequency,
      description: req.body.description || "",
    });

    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const validationError = validateService({ ...req.body });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      {
        serviceCategory: req.body.serviceCategory,
        subService: req.body.subService,
        frequency: req.body.frequency,
        description: req.body.description || "",
      },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    await service.deleteOne();
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};

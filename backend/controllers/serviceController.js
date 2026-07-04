import mongoose from "mongoose";
import Service from "../models/Service.js";
import Client from "../models/Client.js";
import ServiceAssignment from "../models/ServiceAssignment.js";
import {
  notifyServiceAssigned,
  notifyClient,
} from "../services/notificationService.js";

const validateService = (data) => {
  const requiredFields = ["serviceCategory", "subService", "frequency"];
  const missingFields = requiredFields.filter(
    (field) => !data[field] || String(data[field]).trim() === ""
  );
  if (missingFields.length) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  const categories = ["GST", "Income Tax", "TDS", "ROC", "Audit", "Payroll", "PF & ESI", "Registration", "Certification", "Advisory"];
  if (!categories.includes(data.serviceCategory)) {
    return `serviceCategory must be one of: ${categories.join(", ")}`;
  }

  return null;
};

const toPlainObject = (item) => {
  if (!item) return item;
  if (typeof item.toObject === "function") return item.toObject();
  return item;
};

const attachAssignmentStats = async (services = []) => {
  const safeServices = services.map(toPlainObject).filter(Boolean);
  if (safeServices.length === 0) return [];

  const serviceIds = safeServices.map((service) => service._id);

  const assignments = await ServiceAssignment.find({ serviceId: { $in: serviceIds } })
    .populate(
      {
        path: "clientId",
        select: "clientName clientCode email mobile profileImage status isArchived",
        match: { isArchived: false },
      }
    )
    .lean();

  const activeAssignments = assignments.filter(
    (assignment) => assignment.clientId
  );

  const countMap = new Map();
  for (const assignment of activeAssignments) {
    const key = String(assignment.serviceId);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const previewMap = new Map();

  for (const assignment of activeAssignments) {
    const key = String(assignment.serviceId);
    if (!previewMap.has(key)) {
      previewMap.set(key, []);
    }

    const previewList = previewMap.get(key);
    if (previewList.length >= 3) continue;

    previewList.push({
      _id: assignment.clientId._id,
      clientName: assignment.clientId.clientName,
      clientCode: assignment.clientId.clientCode,
      email: assignment.clientId.email,
      mobile: assignment.clientId.mobile,
      status: assignment.clientId.status,
      profileImage: assignment.clientId.profileImage,
    });
  }

  return safeServices.map((service) => {
    const key = String(service._id);
    return {
      ...service,
      clientCount: countMap.get(key) || 0,
      assignedClientsPreview: previewMap.get(key) || [],
    };
  });
};

const buildServiceUpdateMessage = (serviceName, updates = {}) => {
  const details = [];

  if (typeof updates.package !== "undefined") {
    details.push(`package set to ${updates.package}`);
  }

  if (typeof updates.customPrice !== "undefined") {
    details.push(`price updated`);
  }

  if (typeof updates.status !== "undefined") {
    details.push(`status changed to ${updates.status}`);
  }

  if (Array.isArray(updates.assignedUsers)) {
    details.push(`assigned users updated`);
  }

  if (details.length === 0) {
    return `Your ${serviceName} service assignment has been updated.`;
  }

  return `Your ${serviceName} service assignment has been updated (${details.join(", ")}).`;
};

export const getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();
    const enriched = await attachAssignmentStats(services);
    res.json(enriched);
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

    const service = await Service.findById(id).lean();
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const [enriched] = await attachAssignmentStats([service]);
    res.json(enriched);
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

    await ServiceAssignment.deleteMany({ serviceId: id });
    await service.deleteOne();

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ==================== SERVICE ASSIGNMENTS ====================

export const getAvailableClients = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const assignedAssignments = await ServiceAssignment.find({ serviceId });
    const assignedClientIds = assignedAssignments.map((a) =>
      a.clientId.toString()
    );

    const availableClients = await Client.find({
      _id: { $nin: assignedClientIds },
      isArchived: false,
    }).select("_id clientName clientCode email mobile status");

    res.json(availableClients);
  } catch (error) {
    next(error);
  }
};

export const getAssignedClients = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const allAssignments = await ServiceAssignment.find({ serviceId })
      .populate({
        path: "clientId",
        select: "clientName clientCode email mobile profileImage status isArchived",
        match: { isArchived: false },
      })
      .sort({ createdAt: -1 })
      .lean();

    const normalizedSearch = search.trim().toLowerCase();

    let filteredAssignments = allAssignments;
    if (normalizedSearch) {
      filteredAssignments = allAssignments.filter((assignment) => {
        const client = assignment.clientId;
        if (!client) return false;

        return [
          client.clientName,
          client.clientCode,
          client.email,
          client.mobile,
          client.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );
      });
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const total = filteredAssignments.length;
    const startIndex = (pageNumber - 1) * limitNumber;

    const assignments = filteredAssignments.slice(
      startIndex,
      startIndex + limitNumber
    );

    res.json({
      assignments,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignClientsToService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const {
      clientIds,
      package: packageType,
      customPrice,
      assignedUsers,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one client must be selected" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const assignments = [];
    for (const clientId of clientIds) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) continue;

      const client = await Client.findById(clientId);
      if (!client) continue;

      const existing = await ServiceAssignment.findOne({ serviceId, clientId });
      if (existing) continue;

      const assignment = await ServiceAssignment.create({
        serviceId,
        clientId,
        package: packageType || "Standard",
        customPrice: customPrice || null,
        assignedUsers: assignedUsers || [],
        assignedBy: req.user?.name || req.user?.email || "System",
        status: "Active",
      });

      assignments.push(assignment);

      try {
        await notifyServiceAssigned({
          client,
          service,
          sender: req.user?._id,
        });
      } catch (err) {
        console.error("Service notification failed:", err.message);
      }
    }

    res.status(201).json({
      message: `${assignments.length} client(s) assigned to service`,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateServiceAssignment = async (req, res, next) => {
  try {
    const { serviceId, assignmentId } = req.params;
    const {
      assignedUsers,
      customPrice,
      package: packageType,
      status,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(assignmentId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const assignment = await ServiceAssignment.findOne({
      _id: assignmentId,
      serviceId,
    });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (typeof assignedUsers !== "undefined") assignment.assignedUsers = assignedUsers;
    if (typeof customPrice !== "undefined") assignment.customPrice = customPrice;
    if (typeof packageType !== "undefined") assignment.package = packageType;
    if (typeof status !== "undefined") assignment.status = status;

    await assignment.save();

    const populated = await assignment.populate("clientId");

    try {
      const client = await Client.findById(assignment.clientId);
      const service = await Service.findById(assignment.serviceId);

      if (client && service) {
        await notifyClient({
          client,
          title: "Service Assignment Updated",
          message: buildServiceUpdateMessage(service.subService, req.body),
          channels: {
            email: true,
            sms: false,
            whatsapp: true,
          },
          metadata: {
            serviceId: service._id,
            assignmentId: assignment._id,
            event: "service_assignment_updated",
          },
        });
      }
    } catch (err) {
      console.error("Service update notification failed:", err.message);
    }

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateAssignments = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { assignmentIds, updates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one assignment must be selected" });
    }

    const safeUpdates = updates || {};

    const assignmentsToNotify = await ServiceAssignment.find({
      _id: { $in: assignmentIds },
      serviceId,
    }).populate("clientId", "clientName email mobile status");

    const updateFields = {};
    if (typeof safeUpdates.assignedUsers !== "undefined") updateFields.assignedUsers = safeUpdates.assignedUsers;
    if (typeof safeUpdates.customPrice !== "undefined") updateFields.customPrice = safeUpdates.customPrice;
    if (typeof safeUpdates.package !== "undefined") updateFields.package = safeUpdates.package;
    if (typeof safeUpdates.status !== "undefined") updateFields.status = safeUpdates.status;

    const result = await ServiceAssignment.updateMany(
      { _id: { $in: assignmentIds }, serviceId },
      { $set: updateFields }
    );

    const service = await Service.findById(serviceId);

    if (service && assignmentsToNotify.length > 0) {
      for (const assignment of assignmentsToNotify) {
        const client = assignment.clientId;
        if (!client) continue;

        try {
          await notifyClient({
            client,
            title: "Service Assignment Updated",
            message: buildServiceUpdateMessage(service.subService, safeUpdates),
            channels: {
              email: true,
              sms: false,
              whatsapp: true,
            },
            metadata: {
              serviceId: service._id,
              assignmentIds,
              event: "service_assignment_bulk_updated",
            },
          });
        } catch (err) {
          console.error("Bulk update notification failed:", err.message);
        }
      }
    }

    res.json({
      message: `${result.modifiedCount} assignment(s) updated`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const removeClientFromService = async (req, res, next) => {
  try {
    const { serviceId, assignmentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(serviceId) ||
      !mongoose.Types.ObjectId.isValid(assignmentId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const assignment = await ServiceAssignment.findOne({
      _id: assignmentId,
      serviceId,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const client = await Client.findById(assignment.clientId);
    const service = await Service.findById(assignment.serviceId);

    await assignment.deleteOne();

    try {
      if (client && service) {
        await notifyClient({
          client,
          title: "Service Removed",
          message: `${service.subService} has been removed from your account.`,
          channels: {
            email: true,
            sms: false,
            whatsapp: true,
          },
          metadata: {
            serviceId: service._id,
            assignmentId: assignment._id,
            event: "service_removed",
          },
        });
      }
    } catch (err) {
      console.error("Service removal notification failed:", err.message);
    }

    res.json({ message: "Client removed from service" });
  } catch (error) {
    next(error);
  }
};

export const bulkRemoveClientsFromService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { assignmentIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one assignment must be selected" });
    }

    const assignmentsToNotify = await ServiceAssignment.find({
      _id: { $in: assignmentIds },
      serviceId,
    }).populate("clientId", "clientName email mobile status");

    const service = await Service.findById(serviceId);

    const result = await ServiceAssignment.deleteMany({
      _id: { $in: assignmentIds },
      serviceId,
    });

    if (service && assignmentsToNotify.length > 0) {
      for (const assignment of assignmentsToNotify) {
        const client = assignment.clientId;
        if (!client) continue;

        try {
          await notifyClient({
            client,
            title: "Service Removed",
            message: `${service.subService} has been removed from your account.`,
            channels: {
              email: true,
              sms: false,
              whatsapp: true,
            },
            metadata: {
              serviceId: service._id,
              assignmentIds,
              event: "service_bulk_removed",
            },
          });
        } catch (err) {
          console.error("Bulk removal notification failed:", err.message);
        }
      }
    }

    res.json({
      message: `${result.deletedCount} client(s) removed from service`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
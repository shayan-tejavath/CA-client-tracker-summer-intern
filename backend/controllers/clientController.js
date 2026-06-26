import mongoose from "mongoose";
import Client from "../models/Client.js";
import ServiceAssignment from "../models/ServiceAssignment.js";
import { ROLES } from "../middleware/roleMiddleware.js";
import {
  notifyClientCreated,
  notifyClientUpdated,
} from "../services/notificationService.js";

const normalizeArrayField = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // fall back to single value
    }

    return [trimmed];
  }

  return [];
};

const validateClientData = (data) => {
  const requiredFields = ["clientName", "pan", "gstin", "mobile", "email"];

  const missingFields = requiredFields.filter(
    (field) => !data[field] || String(data[field]).trim() === ""
  );

  if (missingFields.length) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  if (data.assignedServices && !Array.isArray(data.assignedServices)) {
    return "assignedServices must be an array of strings";
  }

  return null;
};

// GET CLIENTS
export const getClients = async (req, res, next) => {
  try {
    const search = req.query.search?.trim() || "";
    const status = req.query.status || "All";
    const type = req.query.type || "All";
    const includeArchived = req.query.includeArchived === "true";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
      if (!client) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.json({
        clients: [client],
        pagination: {
          totalClients: 1,
          currentPage: 1,
          totalPages: 1,
          limit,
        },
      });
    }

    if (!includeArchived) {
      query.isArchived = false;
    }

    if (search) {
      query.$or = [
        { clientName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { pan: new RegExp(search, "i") },
        { gstin: new RegExp(search, "i") },
      ];
    }

    if (status !== "All") {
      query.status = status;
    }

    if (type !== "All") {
      query.clientType = type;
    }

    const totalClients = await Client.countDocuments(query);

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      clients,
      pagination: {
        totalClients,
        currentPage: page,
        totalPages: Math.ceil(totalClients / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET CLIENT BY ID
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    if (req.user?.role === ROLES.Client) {
      const currentClient = await Client.findOne({ email: req.user.email });
      if (
        !currentClient ||
        currentClient._id.toString() !== client._id.toString()
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

// CREATE CLIENT
export const createClient = async (req, res, next) => {
  try {
    const validationError = validateClientData(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const existingClient = await Client.findOne({
      $or: [
        {
          pan: req.body.pan.toUpperCase(),
        },
        {
          gstin: req.body.gstin.toUpperCase(),
        },
      ],
    });

    if (existingClient) {
      return res.status(409).json({
        message: "Client with same PAN or GSTIN already exists",
      });
    }

    const assignedServices = normalizeArrayField(req.body.assignedServices);
    const assignedEmployees = normalizeArrayField(req.body.assignedEmployees);

    const client = await Client.create({
      ...req.body,
      assignedServices,
      assignedEmployees,
      profileImage: req.file
        ? `/uploads/${req.file.filename}`
        : req.body.profileImage || "",
      pan: req.body.pan.toUpperCase(),
      gstin: req.body.gstin.toUpperCase(),
      tan: req.body.tan?.toUpperCase(),
    });

    if (assignedServices.length > 0) {
      const assignedUsers = assignedEmployees.length ? assignedEmployees : [];

      try {
        await Promise.all(
          assignedServices.map((serviceId) =>
            ServiceAssignment.create({
              serviceId,
              clientId: client._id,
              assignedUsers,
              assignedBy: req.user?.name || req.user?.email || "System",
            })
          )
        );
      } catch (err) {
        console.error("Service Assignment Error", err);
      }
    }

    try {
      await notifyClientCreated({
        client,
        sender: req.user?._id,
      });
    } catch (err) {
      console.error("Client notification failed:", err.message);
    }

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

// UPDATE CLIENT
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const validationError = validateClientData({
      ...client.toObject(),
      ...req.body,
    });

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    if (req.body.pan || req.body.gstin) {
      const normalizedPan = req.body.pan?.toUpperCase() || client.pan;
      const normalizedGstin = req.body.gstin?.toUpperCase() || client.gstin;

      const duplicateClient = await Client.findOne({
        _id: { $ne: id },
        $or: [{ pan: normalizedPan }, { gstin: normalizedGstin }],
      });

      if (duplicateClient) {
        return res.status(409).json({
          message: "Another client with same PAN or GSTIN exists",
        });
      }
    }

    const assignedServices =
      req.body.assignedServices !== undefined
        ? normalizeArrayField(req.body.assignedServices)
        : normalizeArrayField(client.assignedServices);

    const assignedEmployees =
      req.body.assignedEmployees !== undefined
        ? normalizeArrayField(req.body.assignedEmployees)
        : normalizeArrayField(client.assignedEmployees);

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        ...req.body,
        assignedServices,
        profileImage: req.file
          ? `/uploads/${req.file.filename}`
          : req.body.profileImage || client.profileImage,
        pan: req.body.pan?.toUpperCase() ?? client.pan,
        gstin: req.body.gstin?.toUpperCase() ?? client.gstin,
        tan: req.body.tan?.toUpperCase() ?? client.tan,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Sync service assignments: remove existing and recreate from payload
    try {
      await ServiceAssignment.deleteMany({ clientId: id });

      if (assignedServices.length > 0) {
        await Promise.all(
          assignedServices.map((serviceId) =>
            ServiceAssignment.create({
              serviceId,
              clientId: id,
              assignedUsers: assignedEmployees,
              assignedBy: req.user?.name || req.user?.email || "System",
            })
          )
        );
      }
    } catch (err) {
      // log and continue - don't block the update response
      console.error("Service assignment sync error:", err);
    }

    try {
      await notifyClientUpdated({
        client: updatedClient,
      });
    } catch (err) {
      console.error("Update notification failed:", err.message);
    }

    res.json(updatedClient);
  } catch (error) {
    next(error);
  }
};

// UPDATE CLIENT PROFILE IMAGE
export const updateClientProfileImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Profile image file is required",
      });
    }

    client.profileImage = `/uploads/${req.file.filename}`;
    await client.save();

    res.json(client);
  } catch (error) {
    next(error);
  }
};

// ARCHIVE CLIENT
export const archiveClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    client.isArchived = true;
    client.status = "Archived";

    await client.save();

    res.json({
      message: "Client archived successfully",
    });
  } catch (error) {
    next(error);
  }
};

// RESTORE CLIENT
export const restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    client.isArchived = false;
    client.status = "Active";

    await client.save();

    res.json({
      message: "Client restored successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE CLIENT
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    await client.deleteOne();

    res.json({
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
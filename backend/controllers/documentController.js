import Document from "../models/Document.js";
import Client from "../models/Client.js";
import mongoose from "mongoose";
import { ROLES } from "../middleware/roleMiddleware.js";

const validateDocumentPayload = (data) => {
  const requiredFields = ["client", "task"];
  const missing = requiredFields.filter(
    (field) => !data[field] || String(data[field]).trim() === ""
  );
  if (missing.length) {
    return `Missing required fields: ${missing.join(", ")}`;
  }
  return null;
};

const documentPopulate = (query) =>
  query
    .populate("uploadedBy", "name email role")
    .populate("client", "clientName pan gstin mobile email")
    .populate("task", "title status dueDate assignedTo");

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File upload is required" });
    }

    const validationError = validateDocumentPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
      if (!client || client._id.toString() !== req.body.client) {
        return res.status(403).json({ message: "Clients may only upload documents for their own account." });
      }
    }

    const document = await Document.create({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      client: req.body.client,
      task: req.body.task,
      description: req.body.description || "",
    });

    const createdDocument = await documentPopulate(Document.findById(document._id));
    res.status(201).json(createdDocument);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const { clientId, taskId } = req.query;
    const filter = {};

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
      if (!client) {
        return res.status(403).json({ message: "Forbidden" });
      }
      filter.client = client._id;
    } else {
      if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
        filter.client = clientId;
      }
    }

    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      filter.task = taskId;
    }

    const documents = await documentPopulate(Document.find(filter).sort({ createdAt: -1 }));
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await documentPopulate(Document.findById(id));
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (req.user?.role === ROLES.Client) {
      if (!document.client || document.client.email !== req.user.email) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const updatePayload = {
      client: req.body.client || document.client,
      task: req.body.task || document.task,
      description: req.body.description ?? document.description,
    };

    const updatedDocument = await Document.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    const populated = await documentPopulate(Document.findById(updatedDocument._id));
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await document.deleteOne();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};


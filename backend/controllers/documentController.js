import fs from "fs";
import mongoose from "mongoose";

import Document from "../models/Document.js";
import Client from "../models/Client.js";

import { ROLES } from "../middleware/roleMiddleware.js";



// VALIDATION

const validateDocumentPayload = (data) => {
  const requiredFields = ["client"];

  const missing = requiredFields.filter(
    (field) =>
      !data[field] ||
      String(data[field]).trim() === ""
  );

  if (missing.length) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  return null;
};



// POPULATION

const documentPopulate = (query) =>
  query
    .populate(
      "uploadedBy",
      "name email role"
    )
    .populate(
      "client",
      "clientName pan gstin mobile email"
    )
    .populate(
      "task",
      "title status dueDate assignedTo"
    );



// UPLOAD DOCUMENT

export const uploadDocument = async (
  req,
  res,
  next
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "File upload is required",
      });
    }

    const validationError =
      validateDocumentPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    // CLIENT ACCESS CHECK
    if (req.user?.role === ROLES.Client) {
      const client =
        await Client.findOne({
          email: req.user.email,
        });

      if (
        !client ||
        client._id.toString() !==
          req.body.client
      ) {
        return res.status(403).json({
          message:
            "Clients may only upload documents for their own account.",
        });
      }
    }

    const document =
      await Document.create({
        fileName: req.file.filename,

        originalFileName:
          req.file.originalname,

        filePath: req.file.path,

        fileType: req.file.mimetype,

        fileSize: req.file.size,

        category:
          req.body.category || "Other",

        uploadedBy: req.user._id,

        client: req.body.client,

        task: req.body.task || null,

        description:
          req.body.description || "",

        tags: req.body.tags
          ? req.body.tags
              .split(",")
              .map((tag) =>
                tag.trim()
              )
              .filter(Boolean)
          : [],

        isConfidential:
          req.body.isConfidential ===
          "true",

        expiryDate:
          req.body.expiryDate || null,
      });

    const createdDocument =
      await documentPopulate(
        Document.findById(document._id)
      );

    res.status(201).json(
      createdDocument
    );
  } catch (error) {
    next(error);
  }
};



// GET DOCUMENTS

export const getDocuments = async (
  req,
  res,
  next
) => {
  try {
    const {
      clientId,
      taskId,
      category,
      search,
      includeArchived,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // ARCHIVE FILTER
    if (
      includeArchived !== "true"
    ) {
      filter.isArchived = false;
    }

    // CLIENT ROLE FILTER
    if (req.user?.role === ROLES.Client) {
      const client =
        await Client.findOne({
          email: req.user.email,
        });

      if (!client) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      filter.client = client._id;
    } else {
      if (
        clientId &&
        mongoose.Types.ObjectId.isValid(
          clientId
        )
      ) {
        filter.client = clientId;
      }
    }

    // TASK FILTER
    if (
      taskId &&
      mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
      filter.task = taskId;
    }

    // CATEGORY FILTER
    if (category) {
      filter.category = category;
    }

    // SEARCH FILTER
    if (search) {
      filter.$or = [
        {
          originalFileName:
            new RegExp(search, "i"),
        },
        {
          description:
            new RegExp(search, "i"),
        },
      ];
    }

    // PAGINATION
    const currentPage =
      Number(page);

    const pageSize =
      Number(limit);

    const skip =
      (currentPage - 1) *
      pageSize;

    const totalDocuments =
      await Document.countDocuments(
        filter
      );

    const documents =
      await documentPopulate(
        Document.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageSize)
      );

    res.json({
      documents,
      pagination: {
        total:
          totalDocuments,
        currentPage,
        totalPages:
          Math.ceil(
            totalDocuments /
              pageSize
          ),
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};



// GET DOCUMENT BY ID

export const getDocumentById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      const document =
        await documentPopulate(
          Document.findById(id)
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // CLIENT ACCESS CHECK
      if (
        req.user?.role ===
        ROLES.Client
      ) {
        if (
          !document.client ||
          document.client.email !==
            req.user.email
        ) {
          return res.status(403).json({
            message:
              "Forbidden",
          });
        }
      }

      res.json(document);
    } catch (error) {
      next(error);
    }
  };



// UPDATE DOCUMENT

export const updateDocument =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      const document =
        await Document.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const updatePayload = {
        client:
          req.body.client ||
          document.client,

        task:
          req.body.task ||
          document.task,

        category:
          req.body.category ||
          document.category,

        status:
          req.body.status ||
          document.status,

        description:
          req.body.description ??
          document.description,

        tags: req.body.tags
          ? req.body.tags
              .split(",")
              .map((tag) =>
                tag.trim()
              )
              .filter(Boolean)
          : document.tags,
      };

      const updatedDocument =
        await Document.findByIdAndUpdate(
          id,
          updatePayload,
          {
            new: true,
            runValidators: true,
          }
        );

      const populated =
        await documentPopulate(
          Document.findById(
            updatedDocument._id
          )
        );

      res.json(populated);
    } catch (error) {
      next(error);
    }
  };



// ARCHIVE DOCUMENT

export const archiveDocument =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      const document =
        await Document.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      document.isArchived = true;

      await document.save();

      res.json({
        message:
          "Document archived successfully",
      });
    } catch (error) {
      next(error);
    }
  };



// RESTORE DOCUMENT

export const restoreDocument =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      const document =
        await Document.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      document.isArchived = false;

      await document.save();

      res.json({
        message:
          "Document restored successfully",
      });
    } catch (error) {
      next(error);
    }
  };



// DELETE DOCUMENT

export const deleteDocument =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      const document =
        await Document.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // DELETE FILE FROM STORAGE
      if (
        document.filePath &&
        fs.existsSync(
          document.filePath
        )
      ) {
        fs.unlinkSync(
          document.filePath
        );
      }

      await document.deleteOne();

      res.json({
        message:
          "Document deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
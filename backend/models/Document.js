import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      trim: true,
      default: "",
    },

    filePath: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: [
        "PAN",
        "GST",
        "Invoice",
        "Agreement",
        "Tax Filing",
        "Audit",
        "Compliance",
        "Bank Statement",
        "Other",
      ],
      default: "Other",
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Pending Review",
        "Approved",
        "Rejected",
        "Archived",
      ],
      default: "Active",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model(
  "Document",
  documentSchema
);

export default Document;
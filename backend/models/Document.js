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
      default: "",
      trim: true,
    },

    filePath: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: [
        "GST",
        "Income Tax",
        "TDS",
        "Invoice",
        "Bank Statement",
        "Audit",
        "Payroll",
        "ROC",
        "Legal",
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
      default: "",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isConfidential: {
      type: Boolean,
      default: false,
    },

    expiryDate: {
      type: Date,
      default: null,
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

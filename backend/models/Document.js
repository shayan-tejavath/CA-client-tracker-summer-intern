import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    originalFileName: {
      type: String,
      trim: true,
      default: "",
    },

    filePath: {
      type: String,
      trim: true,
      default: "",
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
        "Digital Signature",
        "DSC",
        "ROC",
        "TDS",
        "Income Tax",
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

    isConfidential: {
      type: Boolean,
      default: false,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    movementType: {
      type: String,
      enum: ["Received", "Given"],
      default: "Received",
    },

    returnStatus: {
      type: String,
      enum: ["Pending Return", "Returned", "Not Returnable"],
      default: "Pending Return",
    },

    returnDate: {
      type: Date,
      default: null,
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
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

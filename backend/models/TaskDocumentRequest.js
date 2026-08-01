import mongoose from "mongoose";

const taskDocumentRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Pending", "Uploaded", "Verified"],
      default: "Pending",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TaskDocumentRequest = mongoose.model("TaskDocumentRequest", taskDocumentRequestSchema);
export default TaskDocumentRequest;

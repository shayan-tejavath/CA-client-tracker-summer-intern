import mongoose from "mongoose";

const taskDocumentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, "Mime type is required"],
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    path: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TaskDocument = mongoose.model("TaskDocument", taskDocumentSchema);
export default TaskDocument;

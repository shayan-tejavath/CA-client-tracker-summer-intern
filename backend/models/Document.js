import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UploadedBy is required"],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
    },
    fileType: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);
export default Document;


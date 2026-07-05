import mongoose from "mongoose";

const subTaskSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Sub-task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SubTask = mongoose.model("SubTask", subTaskSchema);
export default SubTask;

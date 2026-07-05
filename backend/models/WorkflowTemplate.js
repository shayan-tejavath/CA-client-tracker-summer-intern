import mongoose from "mongoose";

const workflowStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Workflow step title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    estimatedDays: {
      type: Number,
      min: 0,
    },
    order: {
      type: Number,
      required: [true, "Workflow step order is required"],
      default: 0,
    },
  },
  { _id: false }
);

const workflowTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workflow template name is required"],
      trim: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
      index: true,
    },
    taskDefinitions: {
      type: [workflowStepSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const WorkflowTemplate = mongoose.model("WorkflowTemplate", workflowTemplateSchema);
export default WorkflowTemplate;

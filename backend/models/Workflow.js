import mongoose from "mongoose";

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  steps: [{ title: String, description: String, order: Number }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Workflow = mongoose.model("Workflow", workflowSchema);
export default Workflow;


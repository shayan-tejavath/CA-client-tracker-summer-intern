import mongoose from "mongoose";

const serviceAssignmentSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID is required"],
    },
    assignedUsers: {
      type: [String],
      default: [],
    },
    customPrice: {
      type: Number,
      default: null,
    },
    package: {
      type: String,
      enum: ["Basic", "Standard", "Premium", "Custom"],
      default: "Standard",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Paused", "Archived"],
      default: "Active",
    },
    assignedOn: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: String,
      default: "System",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one service can only be assigned to a client once
serviceAssignmentSchema.index({ serviceId: 1, clientId: 1 }, { unique: true });

const ServiceAssignment = mongoose.model("ServiceAssignment", serviceAssignmentSchema);
export default ServiceAssignment;
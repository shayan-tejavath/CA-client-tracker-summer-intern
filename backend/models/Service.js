import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceCategory: {
      type: String,
      required: [true, "Service category is required"],
      enum: ["GST", "Income Tax", "TDS", "ROC", "Audit"],
    },
    subService: {
      type: String,
      required: [true, "Sub-service is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
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

const Service = mongoose.model("Service", serviceSchema);
export default Service;


import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    pan: {
      type: String,
      required: [true, "PAN is required"],
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must be a valid format"],
    },
    gstin: {
      type: String,
      required: [true, "GSTIN is required"],
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "GSTIN must be a valid format"],
    },
    tan: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{4}[0-9]{5}[A-Z]$/, "TAN must be a valid format"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[0-9]{10,15}$/, "Mobile must contain 10 to 15 digits"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Email must be a valid address"],
    },
    address: {
      type: String,
      trim: true,
    },
    assignedServices: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);
export default Client;


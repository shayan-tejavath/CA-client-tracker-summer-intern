import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    // BASIC CLIENT INFO
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /.+@.+\..+/,
        "Email must be a valid address",
      ],
    },

    mobile: {
      type: String,
      required: [
        true,
        "Mobile number is required",
      ],
      trim: true,
      match: [
        /^[0-9]{10,15}$/,
        "Mobile must contain 10 to 15 digits",
      ],
    },

    address: {
      type: String,
      trim: true,
    },

    // BUSINESS IDENTIFIERS
    pan: {
      type: String,
      required: [true, "PAN is required"],
      uppercase: true,
      trim: true,
      unique: true,
      match: [
        /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        "PAN must be a valid format",
      ],
    },

    gstin: {
      type: String,
      required: [true, "GSTIN is required"],
      uppercase: true,
      trim: true,
      unique: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "GSTIN must be a valid format",
      ],
    },

    tan: {
      type: String,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z]{4}[0-9]{5}[A-Z]$/,
        "TAN must be a valid format",
      ],
    },

    // CLIENT TYPE
    clientType: {
      type: String,
      enum: [
        "Individual",
        "Business",
        "Partnership",
        "LLP",
        "Private Limited",
      ],
      default: "Business",
    },

    // CLIENT STATUS
    status: {
      type: String,
      enum: [
        "Active",
        "Pending",
        "Inactive",
        "Archived",
      ],
      default: "Active",
    },

    // ASSIGNED SERVICES
    assignedServices: {
      type: [String],
      default: [],
    },

    // TEMPORARY STRING APPROACH
    // later migrate to ObjectId(User)
    assignedManager: {
      type: String,
      trim: true,
      default: "",
    },

    // INTERNAL NOTES
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // SOFT DELETE SUPPORT
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model(
  "Client",
  clientSchema
);

export default Client;
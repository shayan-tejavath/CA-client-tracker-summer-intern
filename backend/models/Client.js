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

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },

    clientCode: {
      type: String,
      trim: true,
      default: "",
    },

    alternateMobile: {
      type: String,
      trim: true,
      match: [
        /^[0-9]{10,15}$/,
        "Alternate mobile must contain 10 to 15 digits",
      ],
      default: "",
    },

    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Alternate email must be a valid address"],
      default: "",
    },

    address: {
      type: String,
      trim: true,
    },

    addressLine1: {
      type: String,
      trim: true,
      default: "",
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
      match: [/[0-9]{4,10}/, "Pincode must contain 4 to 10 digits"],
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    contactPersonEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Contact person email must be a valid address"],
      default: "",
    },

    contactPersonMobile: {
      type: String,
      trim: true,
      match: [/[0-9]{10,15}/, "Contact person mobile must contain 10 to 15 digits"],
      default: "",
    },

    dob: {
      type: Date,
      default: null,
    },

    cin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    msme: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    industryType: {
      type: String,
      trim: true,
      default: "",
    },

    annualTurnover: {
      type: String,
      trim: true,
      default: "",
    },

    businessStartDate: {
      type: Date,
      default: null,
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

    services: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    allowLogin: {
      type: Boolean,
      default: false,
    },

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
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
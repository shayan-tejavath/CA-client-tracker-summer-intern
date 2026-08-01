import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value),
        message: "Permissions must be an array of strings.",
      },
    },
  },
  {
    timestamps: true,
  }
);

permissionSchema.index({ role: 1, companyId: 1 }, { unique: true });

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;

import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;

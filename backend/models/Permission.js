import mongoose from "mongoose";

const validRoles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: validRoles,
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

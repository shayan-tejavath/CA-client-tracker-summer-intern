import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const UserRole = mongoose.model("UserRole", userRoleSchema);
export default UserRole;

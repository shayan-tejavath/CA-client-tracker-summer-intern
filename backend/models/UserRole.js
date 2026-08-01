import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
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

userRoleSchema.index({ name: 1, companyId: 1 }, { unique: true });

const UserRole = mongoose.model("UserRole", userRoleSchema);
export default UserRole;

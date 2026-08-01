import mongoose from "mongoose";

const selfAttendancePermissionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    hasSelfPermission: {
      type: Boolean,
      default: false,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    grantedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const SelfAttendancePermission = mongoose.model(
  "SelfAttendancePermission",
  selfAttendancePermissionSchema
);
export default SelfAttendancePermission;

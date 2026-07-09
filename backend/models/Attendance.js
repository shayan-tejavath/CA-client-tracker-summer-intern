import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "Leave", "Overtime", "Paid Leave"],
      default: "Absent",
    },
    checkInTime: {
      type: String, // HH:mm format
      trim: true,
    },
    checkOutTime: {
      type: String, // HH:mm format
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    markedAt: {
      type: Date,
    },
    isSelfMarked: {
      type: Boolean,
      default: false,
    },
    hasSelfPermission: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Composite index for unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;

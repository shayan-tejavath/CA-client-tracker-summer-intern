import mongoose from "mongoose";

const dscRecordSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
      index: true,
    },
    dscClass: {
      type: String,
      enum: ["Class 1", "Class 2", "Class 3"],
      required: [true, "DSC class is required"],
    },
    password: {
      type: String,
      trim: true,
      default: "",
    },
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["New created", "Submitted", "Rejected", "Renewed", "Renewal Due", "Expired"],
      default: "New created",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DscRecord = mongoose.model("DscRecord", dscRecordSchema);

export default DscRecord;

import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    invoiceNo: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    invoiceAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    settledAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    receiptNo: {
      type: String,
      required: [true, "Receipt number is required"],
      unique: true,
      trim: true,
    },

    billingEntity: {
      type: String,
      enum: ["Primary", "Secondary"],
      default: "Primary",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },

    receiptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Net Banking"],
      default: "UPI",
    },

    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tdsAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },

    settlements: {
      type: [settlementSchema],
      default: [],
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    appliedAmount: {
      type: Number,
      default: 0,
    },

    unappliedAmount: {
      type: Number,
      default: 0,
    },

    ledgerBalance: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Draft", "Completed", "Cancelled"],
      default: "Completed",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Receipt = mongoose.model("Receipt", receiptSchema);
export default Receipt;
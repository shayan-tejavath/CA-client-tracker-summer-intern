import mongoose from "mongoose";

const EXPENSE_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];

const expenseActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    details: { type: String, trim: true, default: "" },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
      trim: true,
      immutable: true,
    },

    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
      default: Date.now,
    },

    category: {
      type: String,
      required: [true, "Expense category is required"],
      trim: true,
    },

    vendor: {
      type: String,
      trim: true,
      default: "",
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentMode: {
      type: String,
      required: [true, "Payment mode is required"],
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [Number.EPSILON, "Amount must be greater than 0"],
    },

    gstPercentage: {
      type: Number,
      default: 0,
      min: [0, "GST percentage cannot be negative"],
    },

    gstAmount: {
      type: Number,
      default: 0,
      min: [0, "GST amount cannot be negative"],
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },

    status: {
      type: String,
      enum: EXPENSE_STATUSES,
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedDate: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    receipt: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    activityHistory: {
      type: [expenseActivitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

expenseSchema.pre("validate", function calculateAmounts(next) {
  if (this.amount != null && this.gstPercentage != null) {
    this.gstAmount = Number(((this.amount * this.gstPercentage) / 100).toFixed(2));
    this.totalAmount = Number((this.amount + this.gstAmount).toFixed(2));
  }
  next();
});

expenseSchema.pre("save", async function generateExpenseNumber() {
  if (!this.isNew || this.expenseNumber) return;

  const year = this.expenseDate.getFullYear();
  const prefix = `EXP-${year}-`;
  const latestExpense = await this.constructor
    .findOne({ expenseNumber: new RegExp(`^${prefix}\\d{4}$`) })
    .sort({ expenseNumber: -1 })
    .select("expenseNumber")
    .lean();

  const lastSequence = latestExpense
    ? Number(latestExpense.expenseNumber.slice(prefix.length))
    : 0;
  this.expenseNumber = `${prefix}${String(lastSequence + 1).padStart(4, "0")}`;
});

const Expense = mongoose.model("Expense", expenseSchema);

export { EXPENSE_STATUSES };
export default Expense;

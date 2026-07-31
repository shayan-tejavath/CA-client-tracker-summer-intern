import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    companyName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;

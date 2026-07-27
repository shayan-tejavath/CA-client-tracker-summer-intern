import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Object },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;

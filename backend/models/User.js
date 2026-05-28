import mongoose from "mongoose";

const validRoles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: validRoles, default: "Client" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;


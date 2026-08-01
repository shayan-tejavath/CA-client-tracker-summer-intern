import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Company from "./models/Company.js";
import connectDB from "./config/db.js";

dotenv.config();

const COMPANY_NAME = "QwikCA Development";
const SUPERADMIN_EMAIL = "admin@test.com";

const users = [
  {
    name: "Super Admin",
    email: SUPERADMIN_EMAIL,
    password: "admin123",
    role: "SuperAdmin",
  },
  {
    name: "Partner",
    email: "partner@test.com",
    password: "partner123",
    role: "Partner",
  },
  {
    name: "Manager",
    email: "manager@test.com",
    password: "manager123",
    role: "Manager",
  },
  {
    name: "Employee",
    email: "employee@test.com",
    password: "employee123",
    role: "Employee",
  },
  {
    name: "Client",
    email: "client@test.com",
    password: "client123",
    role: "Client",
  },
];

async function seedUsers() {
  await connectDB();

  // Create the development company first; all seeded users belong to it.
  let company = await Company.findOne({ companyName: COMPANY_NAME });
  if (!company) {
    company = await Company.create({
      companyName: COMPANY_NAME,
      name: COMPANY_NAME,
      ownerName: "Super Admin",
      email: SUPERADMIN_EMAIL,
      mobile: "",
      owner: null,
    });
    console.log(`Created development company: ${COMPANY_NAME}`);
  }

  let superAdmin = null;

  for (const user of users) {
    const exists = await User.findOne({ email: user.email });
    if (exists) {
      if (!exists.companyId) {
        exists.companyId = company._id;
        await exists.save();
        console.log(`Attached existing user to company: ${user.email}`);
      }
      if (user.role === "SuperAdmin") {
        superAdmin = exists;
      }
      console.log(`User already exists: ${user.email}`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const created = await User.create({
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
      companyId: company._id,
    });
    if (user.role === "SuperAdmin") {
      superAdmin = created;
    }
    console.log(`Created user: ${user.email} (${user.role})`);
  }

  if (superAdmin) {
    await Company.updateOne(
      { _id: company._id },
      { owner: superAdmin._id, ownerName: superAdmin.name }
    );
  }

  mongoose.connection.close();
  console.log("Seeding complete.");
}

seedUsers().catch((err) => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});

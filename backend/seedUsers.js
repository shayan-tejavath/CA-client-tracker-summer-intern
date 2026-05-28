import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();

const users = [
  {
    name: "Super Admin",
    email: "admin@test.com",
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
  for (const user of users) {
    const exists = await User.findOne({ email: user.email });
    if (exists) {
      console.log(`User already exists: ${user.email}`);
      continue;
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await User.create({
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    });
    console.log(`Created user: ${user.email} (${user.role})`);
  }
  mongoose.connection.close();
  console.log("Seeding complete.");
}

seedUsers().catch((err) => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});

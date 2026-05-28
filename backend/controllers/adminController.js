import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Task from "../models/Task.js";
import Document from "../models/Document.js";
import Permission from "../models/Permission.js";

const validRoles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

export const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, clientCount, taskCount, documentCount, roleCountsResult] = await Promise.all([
      User.countDocuments(),
      Client.countDocuments(),
      Task.countDocuments(),
      Document.countDocuments(),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    const roleCounts = validRoles.reduce((acc, role) => {
      const match = roleCountsResult.find((item) => item._id === role);
      acc[role] = match ? match.count : 0;
      return acc;
    }, {});

    res.json({
      totalUsers,
      totalClients: clientCount,
      totalTasks: taskCount,
      totalDocuments: documentCount,
      roleCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ role: 1, name: 1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = "Client" } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const { name, email, role, password } = req.body;

    // Validate that at least one field is provided for update
    if (!name && !email && !role && !password) {
      return res.status(400).json({ message: "At least one field is required to update." });
    }

    // Validate role if provided
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if email is already taken (if changed)
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "Email is already registered." });
      }
    }

    // Update only provided fields
    if (name && name.trim()) user.name = name.trim();
    if (email && email.trim()) user.email = email.trim();
    if (role) user.role = role;
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, updatedAt: user.updatedAt });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find({ role: { $in: validRoles } }).lean();
    const response = validRoles.map((role) => {
      const record = permissions.find((item) => item.role === role);
      return {
        role,
        permissions: record?.permissions || [],
        updatedAt: record?.updatedAt || null,
      };
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (req, res, next) => {
  try {
    const { permissionsByRole } = req.body;
    if (!permissionsByRole || typeof permissionsByRole !== "object") {
      return res.status(400).json({ message: "permissionsByRole must be sent as an object." });
    }

    const updatedRecords = [];
    for (const role of validRoles) {
      const rolePermissions = Array.isArray(permissionsByRole[role]) ? permissionsByRole[role] : [];
      const record = await Permission.findOneAndUpdate(
        { role },
        { $set: { permissions: rolePermissions } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      updatedRecords.push({ role, permissions: record.permissions, updatedAt: record.updatedAt });
    }

    res.json({ message: "Permissions updated successfully.", permissions: updatedRecords });
  } catch (error) {
    next(error);
  }
};

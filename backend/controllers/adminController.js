import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import UserRole from "../models/UserRole.js";
import Client from "../models/Client.js";
import Task from "../models/Task.js";
import Document from "../models/Document.js";
import Permission from "../models/Permission.js";

const systemRoles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const permissionKeyMap = {
  client: {
    create: "client:create",
    edit: "client:update",
    view: "client:read",
    delete: "client:delete",
    ledger: "client:ledger",
    managePackages: "client-packages:manage",
    viewPackages: "client-packages:view",
  },
  task: {
    create: "task:create",
    edit: "task:update",
    view: "task:read",
    delete: "task:delete",
    checklist: "task:checklist",
    verify: "task:verify",
    assign: "task:assign",
    timeLog: "task:time-log",
    deleteNote: "task:note:delete",
  },
  invoice: {
    create: "invoice:create",
    edit: "invoice:update",
    view: "invoice:read",
    delete: "invoice:delete",
  },
  expense: {
    create: "expense:create",
    edit: "expense:update",
    view: "expense:read",
    delete: "expense:delete",
  },
  documents: {
    create: "document:upload",
    edit: "document:update",
    view: "document:read",
    delete: "document:delete",
  },
  attendance: {
    mark: "attendance:mark",
    markPastFuture: "attendance:mark-past-future",
  },
  todo: {
    assign: "todo:assign",
  },
  settings: {
    masters: "system:settings",
  },
  reports: {
    view: "reports:view",
  },
  others: {
    dashboard: "dashboard:view",
  },
};

const ensureSystemRoles = async () => {
  await Promise.all(
    systemRoles.map((name) =>
      UserRole.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, permissions: {}, isSystem: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const getRoleNames = async () => {
  await ensureSystemRoles();
  const roles = await UserRole.find().select("name").lean();
  return roles.map((role) => role.name);
};

const toBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const buildPermissionKeys = (permissions = {}) => {
  const keys = new Set();

  Object.entries(permissionKeyMap).forEach(([section, actions]) => {
    Object.entries(actions).forEach(([action, permissionKey]) => {
      if (permissions?.[section]?.[action]?.enabled) {
        keys.add(permissionKey);
      }
    });
  });

  return Array.from(keys);
};

const syncRolePermissions = async (roleName, permissions = {}) => {
  await Permission.findOneAndUpdate(
    { role: roleName },
    { $set: { permissions: buildPermissionKeys(permissions) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getAdminOverview = async (req, res, next) => {
  try {
    const [totalUsers, clientCount, taskCount, documentCount, roleCountsResult] = await Promise.all([
      User.countDocuments(),
      Client.countDocuments(),
      Task.countDocuments(),
      Document.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

    const roleNames = await getRoleNames();
    const roleCounts = roleNames.reduce((acc, role) => {
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
    const users = await User.find().select("-password").sort({ role: 1, name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const {
      name,
      username,
      mobile,
      email,
      password,
      role = "Client",
      isActive,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    const roleNames = await getRoleNames();
    if (!roleNames.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      mobile,
      email,
      password: hashedPassword,
      role,
      photo: req.file ? `/uploads/${req.file.filename}` : req.body.photo,
      isActive: toBoolean(isActive, true),
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      photo: user.photo,
      isActive: user.isActive,
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

    const { name, username, mobile, email, role, password, isActive } = req.body;

    if (!name && !username && !mobile && !email && !role && !password && typeof isActive === "undefined" && !req.file) {
      return res.status(400).json({ message: "At least one field is required to update." });
    }

    const roleNames = await getRoleNames();
    if (role && !roleNames.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "Email is already registered." });
      }
    }

    if (username && username !== user.username) {
      const usernameTaken = await User.findOne({ username });
      if (usernameTaken) {
        return res.status(400).json({ message: "Username is already taken." });
      }
    }

    if (name && name.trim()) user.name = name.trim();
    if (username && username.trim()) user.username = username.trim();
    if (mobile && mobile.trim()) user.mobile = mobile.trim();
    if (email && email.trim()) user.email = email.trim();
    if (role) user.role = role;
    if (req.file) user.photo = `/uploads/${req.file.filename}`;
    if (typeof isActive !== "undefined") user.isActive = toBoolean(isActive, user.isActive);
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      photo: user.photo,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    });
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

export const getUserRoles = async (req, res, next) => {
  try {
    await ensureSystemRoles();
    const [roles, users] = await Promise.all([
      UserRole.find().sort({ name: 1 }).lean(),
      User.find().select("name role photo").lean(),
    ]);

    res.json(
      roles.map((role) => ({
        ...role,
        assignedUsers: users.filter((user) => user.role === role.name),
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const getUserRole = async (req, res, next) => {
  try {
    await ensureSystemRoles();
    const role = await UserRole.findById(req.params.id).lean();
    if (!role) {
      return res.status(404).json({ message: "User role not found." });
    }
    res.json(role);
  } catch (error) {
    next(error);
  }
};

export const createUserRole = async (req, res, next) => {
  try {
    const { name, permissions = {} } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required." });
    }

    const role = await UserRole.create({
      name: name.trim(),
      permissions,
      isSystem: false,
    });

    await syncRolePermissions(role.name, role.permissions);
    res.status(201).json(role);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Role name already exists." });
    }
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const role = await UserRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "User role not found." });
    }

    const oldName = role.name;
    if (req.body.name && req.body.name.trim() && !role.isSystem) {
      role.name = req.body.name.trim();
    }
    if (req.body.permissions && typeof req.body.permissions === "object") {
      role.permissions = req.body.permissions;
    }

    await role.save();
    if (oldName !== role.name) {
      await User.updateMany({ role: oldName }, { $set: { role: role.name } });
      await Permission.deleteOne({ role: oldName });
    }
    await syncRolePermissions(role.name, role.permissions);
    res.json(role);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Role name already exists." });
    }
    next(error);
  }
};

export const deleteUserRole = async (req, res, next) => {
  try {
    const role = await UserRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "User role not found." });
    }
    if (role.isSystem) {
      return res.status(400).json({ message: "System roles cannot be deleted." });
    }

    const assignedUsers = await User.countDocuments({ role: role.name });
    if (assignedUsers > 0) {
      return res.status(400).json({ message: "Cannot delete a role assigned to users." });
    }

    await Permission.deleteOne({ role: role.name });
    await role.deleteOne();
    res.json({ message: "User role deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (req, res, next) => {
  try {
    const roleNames = await getRoleNames();
    const permissions = await Permission.find({ role: { $in: roleNames } }).lean();
    const response = roleNames.map((role) => {
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
    const roleNames = await getRoleNames();
    for (const role of roleNames) {
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

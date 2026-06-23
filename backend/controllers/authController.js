import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Permission from "../models/Permission.js";
import { getPermissionsForRole } from "../constants/rbac.js";
import generateToken from "../utils/generateToken.js";

const validRoles = [
  "SuperAdmin",
  "Partner",
  "Manager",
  "Employee",
  "Client",
];

// Blocked public email providers
const blockedDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
];

// Internal organization roles
const internalRoles = [
  "SuperAdmin",
  "Partner",
  "Manager",
  "Employee",
];

// Validate official company email
const isOfficialCompanyEmail = (email) => {
  const domain = email.split("@")[1];

  if (!domain) return false;

  return !blockedDomains.includes(
    domain.toLowerCase()
  );
};

// Resolve permissions dynamically
const resolveRolePermissions = async (role) => {
  const record = await Permission.findOne({
    role,
  }).lean();

  if (
    record &&
    Array.isArray(record.permissions) &&
    record.permissions.length > 0
  ) {
    return record.permissions;
  }

  return getPermissionsForRole(role);
};

// REGISTER
export const register = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
      password,
      role = "Client",
    } = req.body;

    // Validate role
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role provided",
      });
    }

    if (
      internalRoles.includes(role) &&
      req.get("x-internal-registration-secret") !==
        process.env.INTERNAL_REGISTRATION_SECRET
    ) {
      return res.status(403).json({
        message: "Internal user registration is not allowed.",
      });
    }

    // Validate official email for internal roles
    if (
      internalRoles.includes(role) &&
      !isOfficialCompanyEmail(email)
    ) {
      return res.status(400).json({
        message:
          "Internal users must use official company email addresses.",
      });
    }

    // Check existing user
    const userExists = await User.findOne({
      email,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Generate permissions
    const permissions =
      await resolveRolePermissions(user.role);

    // Response
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
export const login = async (
  req,
  res,
  next
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Official email validation for internal roles
    if (
      internalRoles.includes(user.role) &&
      !isOfficialCompanyEmail(user.email)
    ) {
      return res.status(403).json({
        message:
          "Access denied. Please use your official company email.",
      });
    }

    // Block archived clients from signing in
    if (user.role === "Client") {
      const client = await Client.findOne({ email: user.email });
      if (!client || client.isArchived) {
        return res.status(403).json({
          message: "Client access denied. Client account is archived.",
        });
      }
    }

    // Compare password
    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Permissions
    const permissions =
      await resolveRolePermissions(user.role);

    // Generate token
    const token = generateToken(user);

    // Success response
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

// PROFILE
export const getProfile = async (
  req,
  res,
  next
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    if (req.user.role === "Client") {
      const client = await Client.findOne({ email: req.user.email });
      if (!client || client.isArchived) {
        return res.status(403).json({
          message: "Client access denied. Client account is archived.",
        });
      }
    }

    const permissions =
      await resolveRolePermissions(
        req.user.role
      );

    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

// SUPER ADMIN TEST ROUTE
export const getSuperAdminDashboard =
  async (req, res, next) => {
    try {
      res.json({
        message:
          "Welcome SuperAdmin. This route is role protected.",
      });
    } catch (error) {
      next(error);
    }
  };

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Permission from "../models/Permission.js";
import Company from "../models/Company.js";
import { getPermissionsForRole } from "../constants/rbac.js";
import generateToken from "../utils/generateToken.js";
import {
  notifyEmployeeWelcome,
} from "../services/notificationService.js";

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
      companyName,
      ownerName,
      username,
      mobile,
    } = req.body;

    const normalizedRole = role === "SuperAdmin" ? "SuperAdmin" : role;

    // Validate role
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid role provided",
      });
    }

    if (normalizedRole === "SuperAdmin") {
      if (!companyName || !companyName.trim()) {
        return res.status(400).json({ message: "Company Name is required." });
      }

      if (!isOfficialCompanyEmail(email.trim())) {
        return res.status(400).json({
          message: "SuperAdmin accounts must use an official company email address.",
        });
      }

      if (!ownerName || !ownerName.trim()) {
        return res.status(400).json({ message: "Owner Name is required." });
      }

      if (!username || !username.trim()) {
        return res.status(400).json({ message: "Username is required." });
      }

      if (!mobile || !mobile.trim()) {
        return res.status(400).json({ message: "Mobile number is required." });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required." });
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required." });
      }

      if (!/^\+?[0-9\s-]{7,15}$/.test(mobile.trim())) {
        return res.status(400).json({ message: "Enter a valid mobile number." });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }
    } else if (
      internalRoles.includes(normalizedRole) &&
      req.get("x-internal-registration-secret") !==
        process.env.INTERNAL_REGISTRATION_SECRET
    ) {
      return res.status(403).json({
        message: "Internal user registration is not allowed.",
      });
    }

    // Validate official email for internal roles
    if (
      internalRoles.includes(normalizedRole) &&
      normalizedRole !== "SuperAdmin" &&
      !isOfficialCompanyEmail(email)
    ) {
      return res.status(400).json({
        message:
          "Internal users must use official company email addresses.",
      });
    }

    // Check existing user
    const userExists = await User.findOne({
      email: email?.trim(),
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (username && username.trim()) {
      const usernameExists = await User.findOne({
        username: username.trim(),
      });
      if (usernameExists) {
        return res.status(400).json({
          message: "Username is already taken.",
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    if (normalizedRole === "SuperAdmin") {
      const company = await Company.create({
        companyName: companyName.trim(),
        name: companyName.trim(),
        ownerName: ownerName?.trim() || name?.trim() || "Super Admin",
        email: email.trim(),
        mobile: mobile?.trim() || "",
        owner: null,
      });

      const user = await User.create({
        name: ownerName?.trim() || name?.trim() || "Super Admin",
        username: username?.trim(),
        mobile: mobile?.trim(),
        email: email.trim(),
        password: hashedPassword,
        role: normalizedRole,
        companyId: company._id,
      });

      await Company.findByIdAndUpdate(company._id, {
        owner: user._id,
        ownerName: ownerName?.trim() || name?.trim() || "Super Admin",
      });

      if (internalRoles.includes(user.role)) {
        try {
          await notifyEmployeeWelcome({
            user,
          });
        } catch (err) {
          console.error(
            "Welcome email failed:",
            err.message
          );
        }
      }

      const permissions = await resolveRolePermissions(user.role);

      res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.companyName || company.name,
        },
        token: generateToken(user),
        permissions,
      });
      return;
    }

    const user = await User.create({
      name: ownerName?.trim() || name?.trim() || "Super Admin",
      username: username?.trim(),
      mobile: mobile?.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: normalizedRole,
    });

    if (internalRoles.includes(user.role)) {
      try {
        await notifyEmployeeWelcome({
          user,
        });
      } catch (err) {
        console.error(
          "Welcome email failed:",
          err.message
        );
      }
    }

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

// SIGNUP - public endpoint for creating a SuperAdmin and company
export const signup = async (req, res, next) => {
  try {
    const {
      companyName,
      ownerName,
      username,
      mobile,
      email,
      password,
    } = req.body;

    // Validate required fields
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: "Company Name is required." });
    }

    if (!ownerName || !ownerName.trim()) {
      return res.status(400).json({ message: "Owner Name is required." });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required." });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Basic mobile validation
    if (!/^\+?[0-9\s-]{7,15}$/.test(mobile.trim())) {
      return res.status(400).json({ message: "Enter a valid mobile number." });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    // Prevent duplicate email or username
    const existingByEmail = await User.findOne({ email: email.trim() });
    if (existingByEmail) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    if (username && username.trim()) {
      const existingByUsername = await User.findOne({ username: username.trim() });
      if (existingByUsername) {
        return res.status(400).json({ message: "Username is already taken." });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Force role as SuperAdmin
    const role = "SuperAdmin";

    const company = await Company.create({
      companyName: companyName.trim(),
      name: companyName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      owner: null,
    });

    // Create user record (owner)
    const user = await User.create({
      name: ownerName.trim(),
      username: username.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      password: hashedPassword,
      role,
      companyId: company._id,
    });

    await Company.findByIdAndUpdate(company._id, {
      owner: user._id,
      ownerName: ownerName.trim(),
    });

    // Notify welcome for internal roles
    if (internalRoles.includes(user.role)) {
      try {
        await notifyEmployeeWelcome({ user });
      } catch (err) {
        console.error("Welcome email failed:", err.message);
      }
    }

    // Permissions
    const permissions = await resolveRolePermissions(user.role);

    // Response
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: {
        id: company._id,
        name: company.companyName || company.name,
      },
      companyId: company._id,
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

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
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

    if (req.user.isActive === false) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
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

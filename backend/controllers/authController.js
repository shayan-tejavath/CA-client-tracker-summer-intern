import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Client from "../models/Client.js";
import Company from "../models/Company.js";
import { findPermissionForRole } from "../utils/companyScope.js";
import { getPermissionsForRole } from "../constants/rbac.js";
import generateToken from "../utils/generateToken.js";
import {
  notifyEmployeeWelcome,
} from "../services/notificationService.js";

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
const resolveRolePermissions = async (role, companyId) => {
  const record = await findPermissionForRole(
    role,
    companyId
  );

  if (
    record &&
    Array.isArray(record.permissions) &&
    record.permissions.length > 0
  ) {
    return record.permissions;
  }

  return getPermissionsForRole(role);
};

// Error messages raised when the connected MongoDB does not support
// multi-document transactions (e.g. standalone or Atlas M0 shared tier).
const TRANSACTION_UNSUPPORTED_ERROR =
  /Transaction numbers are only allowed|retryable writes|does not support multi-document|not a replica set/i;

const removeCompany = async (companyId) => {
  try {
    await Company.deleteOne({ _id: companyId });
  } catch (err) {
    console.error("Failed to roll back company:", err.message);
  }
};

// Fallback used when transactions are unavailable: create sequentially and
// delete the company if the SuperAdmin creation or owner assignment fails.
const createCompanyAndSuperAdminSequential = async ({
  companyName,
  ownerName,
  username,
  mobile,
  email,
  password,
}) => {
  const company = await Company.create({
    companyName,
    name: companyName,
    ownerName,
    email,
    mobile: mobile || "",
    owner: null,
  });

  try {
    const user = await User.create({
      name: ownerName,
      username,
      mobile,
      email,
      password,
      role: "SuperAdmin",
      companyId: company._id,
    });

    await Company.updateOne(
      { _id: company._id },
      { owner: user._id, ownerName }
    );

    return { user, company };
  } catch (error) {
    await removeCompany(company._id);
    throw error;
  }
};

// Canonical onboarding: Company + SuperAdmin + owner assignment must all
// succeed or all roll back. Uses a Mongo transaction when the deployment
// supports it, otherwise degrades to sequential creation with rollback.
const createCompanyAndSuperAdmin = async (data) => {
  const session = await mongoose.startSession();
  let user = null;
  let company = null;

  try {
    await session.withTransaction(async () => {
      const createdCompany = await Company.create(
        [
          {
            companyName: data.companyName,
            name: data.companyName,
            ownerName: data.ownerName,
            email: data.email,
            mobile: data.mobile || "",
            owner: null,
          },
        ],
        { session }
      );

      const createdUser = await User.create(
        [
          {
            name: data.ownerName,
            username: data.username,
            mobile: data.mobile,
            email: data.email,
            password: data.password,
            role: "SuperAdmin",
            companyId: createdCompany[0]._id,
          },
        ],
        { session }
      );

      await Company.updateOne(
        { _id: createdCompany[0]._id },
        { owner: createdUser[0]._id, ownerName: data.ownerName },
        { session }
      );

      user = createdUser[0];
      company = createdCompany[0];
    });

    return { user, company };
  } catch (error) {
    if (TRANSACTION_UNSUPPORTED_ERROR.test(error.message)) {
      return createCompanyAndSuperAdminSequential(data);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const sendWelcomeNotification = async (user) => {
  if (internalRoles.includes(user.role)) {
    try {
      await notifyEmployeeWelcome({ user });
    } catch (err) {
      console.error("Welcome email failed:", err.message);
    }
  }
};

// REGISTER - public endpoint. Registration of a new CA firm only:
// creates the Company and that Company's SuperAdmin.
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
      role = "SuperAdmin",
      companyName,
      ownerName,
      username,
      mobile,
    } = req.body;

    const normalizedRole = role === "SuperAdmin" ? "SuperAdmin" : role;

    // Only SuperAdmin onboarding is allowed through public registration.
    if (normalizedRole !== "SuperAdmin") {
      return res.status(400).json({
        message:
          "Public registration only supports SuperAdmin accounts. Partner, Manager, Employee and Client accounts must be created by a company administrator.",
      });
    }

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

    const resolvedOwnerName =
      ownerName?.trim() || name?.trim() || "Super Admin";

    const { user, company } = await createCompanyAndSuperAdmin({
      companyName: companyName.trim(),
      ownerName: resolvedOwnerName,
      username: username?.trim(),
      mobile: mobile?.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    await sendWelcomeNotification(user);

    const permissions = await resolveRolePermissions(user.role, user.companyId);

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

// SIGNUP - public endpoint for creating a SuperAdmin and company.
// Shares the canonical onboarding implementation with register.
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

    // Consistent official-company-email policy: signup must not create a
    // SuperAdmin that login will later reject.
    if (!isOfficialCompanyEmail(email.trim())) {
      return res.status(400).json({
        message: "SuperAdmin accounts must use an official company email address.",
      });
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

    const { user, company } = await createCompanyAndSuperAdmin({
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      username: username.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    await sendWelcomeNotification(user);

    // Permissions
    const permissions = await resolveRolePermissions(user.role, user.companyId);

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

    if (!user.companyId) {
      return res.status(403).json({
        message: "No company associated with your account. Please contact your administrator.",
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
      const client = await Client.findOne({
        email: user.email,
        companyId: user.companyId,
      });
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
      await resolveRolePermissions(user.role, user.companyId);

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
      const client = await Client.findOne({
        email: req.user.email,
        companyId: req.user.companyId,
      });
      if (!client || client.isArchived) {
        return res.status(403).json({
          message: "Client access denied. Client account is archived.",
        });
      }
    }

    const permissions =
      await resolveRolePermissions(
        req.user.role,
        req.user.companyId
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

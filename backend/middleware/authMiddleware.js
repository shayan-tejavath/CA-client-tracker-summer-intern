import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Client from "../models/Client.js";
import { ROLES } from "./roleMiddleware.js";

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    console.error("[AUTH] No token provided");
    return res.status(401).json({ message: "Not authorized - no token" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("[AUTH] JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.error("[AUTH] User not found for ID:", decoded.id);
      return res.status(401).json({ message: "Not authorized - user not found" });
    }

    if (user.role === ROLES.Client) {
      const client = await Client.findOne({ email: user.email });
      if (!client || client.isArchived) {
        return res.status(403).json({ message: "Client access denied. Client account is archived." });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[AUTH] Token verification error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(401).json({ message: "Not authorized" });
  }
};

export default protect;


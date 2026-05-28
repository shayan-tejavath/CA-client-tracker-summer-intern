import jwt from "jsonwebtoken";

// Enhanced token generation with role for stateless authorization
const generateToken = (user) => {
  // Support both old format (just id) and new format (user object)
  const payload = typeof user === 'string' ? { id: user } : {
    id: user._id || user.id,
    role: user.role,
    email: user.email,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;


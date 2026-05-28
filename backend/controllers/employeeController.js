import User from "../models/User.js";

export const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: "Employee" });
    res.json(employees);
  } catch (error) {
    next(error);
  }
};


import User from "../models/User.js";
import { getCompanyFilter } from "../utils/companyScope.js";

export const getEmployees = async (req, res, next) => {
  try {
    const companyFilter = getCompanyFilter(req);
    const query = { role: "Employee", ...companyFilter };
    const employees = await User.find(query);
    res.json(employees);
  } catch (error) {
    next(error);
  }
};


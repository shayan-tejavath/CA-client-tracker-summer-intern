import api from "./api.js";

// Get all users for attendance management
export const getAllUsersForAttendance = async () => {
  const response = await api.get("/attendance/all-users");
  return response.data;
};

// Get attendance by date
export const getAttendanceByDate = async (date) => {
  const response = await api.get("/attendance/by-date", { params: { date } });
  return response.data;
};

// Mark attendance manually
export const markAttendance = async (attendanceData) => {
  const response = await api.post("/attendance/mark", attendanceData);
  return response.data;
};

// Grant self-attendance permission
export const grantSelfPermission = async (userId) => {
  const response = await api.post("/attendance/grant-permission", { userId });
  return response.data;
};

// Revoke self-attendance permission
export const revokeSelfPermission = async (userId) => {
  const response = await api.post("/attendance/revoke-permission", { userId });
  return response.data;
};

// Self check-in
export const selfCheckIn = async (date) => {
  const response = await api.post("/attendance/self-check-in", { date });
  return response.data;
};

// Self check-out
export const selfCheckOut = async (date) => {
  const response = await api.post("/attendance/self-check-out", { date });
  return response.data;
};

// Get monthly report
export const getMonthlyReport = async (month, year, userId = null) => {
  const params = { month, year };
  if (userId) params.userId = userId;
  const response = await api.get("/attendance/monthly-report", { params });
  return response.data;
};

// Bulk mark attendance
export const bulkMarkAttendance = async (attendanceData) => {
  const response = await api.post("/attendance/bulk-mark", { attendanceData });
  return response.data;
};

// Get user's attendance
export const getUserAttendance = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/attendance/my-attendance", { params });
  return response.data;
};

// Get self-permission status
export const getSelfPermissionStatus = async () => {
  const response = await api.get("/attendance/permission-status");
  return response.data;
};

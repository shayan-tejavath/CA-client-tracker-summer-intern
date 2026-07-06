import api from "./api";

const normalizeResponse = (response) => response.data;

export const getReportsAnalytics = async () => {
  const response = await api.get("/reports/analytics");
  return normalizeResponse(response);
};

export const getTaskReports = async (params = {}) => {
  const response = await api.get("/reports/tasks", { params });
  return normalizeResponse(response);
};

export const getServiceReports = async (params = {}) => {
  const response = await api.get("/reports/services", { params });
  return normalizeResponse(response);
};

export const getClientReports = async (params = {}) => {
  const response = await api.get("/reports/clients", { params });
  return normalizeResponse(response);
};

export const getEmployeeReports = async (params = {}) => {
  const response = await api.get("/reports/employees", { params });
  return normalizeResponse(response);
};

export const exportReport = async ({ type, format = "xlsx", params = {} }) => {
  const response = await api.get(`/reports/export/${type}`, {
    params: { format, ...params },
    responseType: "blob",
  });

  return response.data;
};
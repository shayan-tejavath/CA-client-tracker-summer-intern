import api from "./api";

export const getExpenses = async (params = {}) => {
  const response = await api.get("/expenses", { params });
  return response.data;
};

export const exportExpenses = async (params = {}) => {
  const response = await api.get("/expenses/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export const getExpenseById = async (expenseId) => {
  const response = await api.get(`/expenses/${expenseId}`);
  return response.data;
};

export const getExpenseDashboard = async () => {
  const response = await api.get("/expenses/dashboard");
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post("/expenses", expenseData);
  return response.data;
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await api.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
};

export const approveExpense = async (expenseId) => {
  const response = await api.patch(`/expenses/${expenseId}/approve`);
  return response.data;
};

export const rejectExpense = async (expenseId, rejectionReason) => {
  const response = await api.patch(`/expenses/${expenseId}/reject`, { rejectionReason });
  return response.data;
};

export const markExpensePaid = async (expenseId) => {
  const response = await api.patch(`/expenses/${expenseId}/mark-paid`);
  return response.data;
};

export const uploadExpenseReceipt = async (expenseId, receipt) => {
  const formData = new FormData();
  formData.append("receipt", receipt, receipt.name);
  const response = await api.post(`/expenses/${expenseId}/receipt`, formData);
  return response.data;
};

export const getExpenseReceiptPreview = async (expenseId) => {
  const response = await api.get(`/expenses/${expenseId}/receipt/preview`, {
    responseType: "blob",
  });
  return {
    url: URL.createObjectURL(response.data),
    contentType: response.headers["content-type"] || "",
  };
};

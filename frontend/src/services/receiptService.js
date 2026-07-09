import api from "./api";

export const getReceipts = async () => {
  const response = await api.get("/receipts");
  return response.data;
};

export const getReceiptById = async (receiptId) => {
  const response = await api.get(`/receipts/${receiptId}`);
  return response.data;
};

export const getOpenInvoicesByClient = async (clientId) => {
  const response = await api.get(`/receipts/client/${clientId}/open-invoices`);
  return response.data;
};

export const createReceipt = async (receiptData) => {
  const response = await api.post("/receipts", receiptData);
  return response.data;
};

export const updateReceipt = async (receiptId, receiptData) => {
  const response = await api.put(`/receipts/${receiptId}`, receiptData);
  return response.data;
};

export const deleteReceipt = async (receiptId) => {
  const response = await api.delete(`/receipts/${receiptId}`);
  return response.data;
};
import api from "./api";

const BASE_URL = "/invoices";

export const invoiceService = {
  // ==========================================
  // GET ALL INVOICES
  // ==========================================
  getInvoices: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  // ==========================================
  // GET SINGLE INVOICE
  // ==========================================
  getInvoiceById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // ==========================================
  // GET INVOICES BY CLIENT
  // ==========================================
  getInvoicesByClient: async (clientId, openOnly = false) => {
    const response = await api.get(
      `${BASE_URL}/client/${clientId}?openOnly=${openOnly}`
    );

    return response.data;
  },

  // ==========================================
  // CREATE INVOICE
  // ==========================================
  createInvoice: async (invoiceData) => {
    const response = await api.post(BASE_URL, invoiceData);
    return response.data;
  },

  // ==========================================
  // UPDATE INVOICE
  // ==========================================
  updateInvoice: async (id, invoiceData) => {
    const response = await api.put(
      `${BASE_URL}/${id}`,
      invoiceData
    );

    return response.data;
  },

  // ==========================================
  // DELETE INVOICE
  // ==========================================
  deleteInvoice: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default invoiceService;
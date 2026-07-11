import api from "./api";

const BASE_URL = "/quotations";

export const quotationService = {
  getQuotations: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getQuotationById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createQuotation: async (quotationData) => {
    const response = await api.post(BASE_URL, quotationData);
    return response.data;
  },

  updateQuotation: async (id, quotationData) => {
    const response = await api.put(`${BASE_URL}/${id}`, quotationData);
    return response.data;
  },

  shareQuotation: async (id, payload = {}) => {
    const response = await api.post(`${BASE_URL}/${id}/share`, payload);
    return response.data;
  },

  downloadQuotationPdf: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}/pdf`, { responseType: "blob" });
    return response.data;
  },

  deleteQuotation: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default quotationService;

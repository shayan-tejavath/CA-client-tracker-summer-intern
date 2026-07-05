import api from "./api";

export const getDscRecords = async (filters = {}) => {
  const response = await api.get("/dsc", {
    params: filters,
  });
  return response.data;
};

export const createDscRecord = async (payload) => {
  const response = await api.post("/dsc", payload);
  return response.data;
};

export const updateDscRecord = async (recordId, payload) => {
  const response = await api.put(`/dsc/${recordId}`, payload);
  return response.data;
};

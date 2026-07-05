import api from "./api";

export const getChecklistsByTask = async (taskId) => {
  const response = await api.get(`/checklists/task/${taskId}`);
  return response.data;
};

export const createChecklistItem = async (taskId, checklistData) => {
  const response = await api.post(`/checklists/task/${taskId}`, checklistData);
  return response.data;
};

export const updateChecklistItem = async (checklistId, checklistData) => {
  const response = await api.put(`/checklists/${checklistId}`, checklistData);
  return response.data;
};

export const deleteChecklistItem = async (checklistId) => {
  const response = await api.delete(`/checklists/${checklistId}`);
  return response.data;
};

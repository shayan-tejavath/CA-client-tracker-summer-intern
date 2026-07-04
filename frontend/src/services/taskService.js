import api from "./api";

export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const postTaskComment = async (taskId, commentData) => {
  const response = await api.post(`/tasks/${taskId}/comments`, commentData);
  return response.data;
};

export const getSubTasks = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/subtasks`);
  return response.data;
};

export const createSubTask = async (taskId, subTaskData) => {
  const response = await api.post(`/tasks/${taskId}/subtasks`, subTaskData);
  return response.data;
};

export const updateSubTask = async (taskId, subTaskId, subTaskData) => {
  const response = await api.put(`/tasks/${taskId}/subtasks/${subTaskId}`, subTaskData);
  return response.data;
};

export const deleteSubTask = async (taskId, subTaskId) => {
  const response = await api.delete(`/tasks/${taskId}/subtasks/${subTaskId}`);
  return response.data;
};

export const getTaskDocuments = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/documents`);
  return response.data;
};

export const uploadTaskDocument = async (taskId, formData) => {
  const response = await api.post(`/tasks/${taskId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteTaskDocument = async (taskId, documentId) => {
  const response = await api.delete(`/tasks/${taskId}/documents/${documentId}`);
  return response.data;
};

export const getTaskActivities = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/activities`);
  return response.data;
};

export const getTaskDocumentRequests = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/document-requests`);
  return response.data;
};

export const createTaskDocumentRequest = async (taskId, payload) => {
  const response = await api.post(`/tasks/${taskId}/document-requests`, payload);
  return response.data;
};

export const updateTaskDocumentRequestStatus = async (taskId, requestId, status) => {
  const response = await api.put(`/tasks/${taskId}/document-requests/${requestId}`, { status });
  return response.data;
};

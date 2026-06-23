import api from "./api";

export const getServices = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const getServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await api.post("/services", serviceData);
  return response.data;
};

export const updateService = async (serviceId, serviceData) => {
  const response = await api.put(`/services/${serviceId}`, serviceData);
  return response.data;
};

export const deleteService = async (serviceId) => {
  const response = await api.delete(`/services/${serviceId}`);
  return response.data;
};

// ==================== SERVICE ASSIGNMENTS ====================

export const getAvailableClients = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}/available-clients`);
  return response.data;
};

export const getAssignedClients = async (serviceId, { page = 1, limit = 10, search = "" } = {}) => {
  const response = await api.get(`/services/${serviceId}/assigned-clients`, {
    params: { page, limit, search },
  });
  return response.data;
};

export const assignClientsToService = async (serviceId, { clientIds, package: pkg, customPrice, assignedUsers }) => {
  const response = await api.post(`/services/${serviceId}/assign-clients`, {
    clientIds,
    package: pkg,
    customPrice,
    assignedUsers,
  });
  return response.data;
};

export const updateServiceAssignment = async (serviceId, assignmentId, updates) => {
  const response = await api.put(`/services/${serviceId}/assignments/${assignmentId}`, updates);
  return response.data;
};

export const bulkUpdateAssignments = async (serviceId, { assignmentIds, updates }) => {
  const response = await api.patch(`/services/${serviceId}/assignments/bulk-update`, {
    assignmentIds,
    updates,
  });
  return response.data;
};

export const removeClientFromService = async (serviceId, assignmentId) => {
  const response = await api.delete(`/services/${serviceId}/assignments/${assignmentId}`);
  return response.data;
};

export const bulkRemoveClientsFromService = async (serviceId, assignmentIds) => {
  const response = await api.post(`/services/${serviceId}/assignments/bulk-remove`, {
    assignmentIds,
  });
  return response.data;
};

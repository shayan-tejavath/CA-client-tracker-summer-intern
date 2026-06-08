import api from "./api";



// GET ALL CLIENTS

export const getClients = async ({
  search = "",
  status = "All",
  type = "All",
  includeArchived = false,
  page = 1,
  limit = 10,
} = {}) => {
  const response = await api.get(
    `/clients`,
    {
      params: {
        search,
        status,
        type,
        includeArchived,
        page,
        limit,
      },
    }
  );

  return response.data;
};


// GET CLIENT BY ID

export const getClientById = async (
  clientId
) => {
  const response = await api.get(
    `/clients/${clientId}`
  );

  return response.data;
};



// CREATE CLIENT

export const createClient = async (
  clientData
) => {
  const response = await api.post(
    "/clients",
    clientData
  );

  return response.data;
};



// UPDATE CLIENT

export const updateClient = async (
  clientId,
  clientData
) => {
  const response = await api.put(
    `/clients/${clientId}`,
    clientData
  );

  return response.data;
};



// ARCHIVE CLIENT

export const archiveClient = async (
  clientId
) => {
  const response = await api.patch(
    `/clients/${clientId}/archive`
  );

  return response.data;
};



// RESTORE CLIENT

export const restoreClient = async (
  clientId
) => {
  const response = await api.patch(
    `/clients/${clientId}/restore`
  );

  return response.data;
};



// DELETE CLIENT

export const deleteClient = async (
  clientId
) => {
  const response = await api.delete(
    `/clients/${clientId}`
  );

  return response.data;
};
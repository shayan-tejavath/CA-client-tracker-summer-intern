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

const isFormData = (data) =>
  data && typeof data.append === "function";

export const createClient = async (
  clientData
) => {
  const config = isFormData(clientData)
    ? undefined
    : { headers: { "Content-Type": "application/json" } };

  const response = await api.post(
    "/clients",
    clientData,
    config
  );

  return response.data;
};



// UPDATE CLIENT

export const updateClient = async (
  clientId,
  clientData
) => {
  const config = isFormData(clientData)
    ? undefined
    : { headers: { "Content-Type": "application/json" } };

  const response = await api.put(
    `/clients/${clientId}`,
    clientData,
    config
  );

  return response.data;
};

export const updateClientPhoto = async (
  clientId,
  profileImageFile
) => {
  const formData = new FormData();
  formData.append("profileImage", profileImageFile, profileImageFile.name);

  const response = await api.post(
    `/clients/${clientId}/photo`,
    formData
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

/* ======================================================
   BULK IMPORT CLIENTS
====================================================== */

export const bulkImportClients = async (
  file
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/clients/import",
    formData
  );

  return response.data;
};

/* ======================================================
   PREVIEW CLIENT IMPORT
====================================================== */

export const previewClientImport =
  async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
      "/clients/preview-import",
      formData
    );

    return response.data;
  };

/* ======================================================
   DOWNLOAD TEMPLATE
====================================================== */

export const downloadClientTemplate =
  async () => {
    const response = await api.get(
      "/clients/download-template",
      {
        responseType: "blob",
      }
    );

    const blob = new Blob(
      [response.data],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "client-import-template.xlsx";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };
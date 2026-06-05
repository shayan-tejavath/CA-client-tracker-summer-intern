import api from "./api";



// ========================================
// GET DOCUMENTS
// ========================================

export const getDocuments = async (
  includeArchived = false,
  filters = {}
) => {

  const response = await api.get(
    "/documents",
    {
      params: {
        includeArchived,
        ...filters,
      },
    }
  );

  return response.data;
};



// ========================================
// GET DOCUMENT BY ID
// ========================================

export const getDocumentById =
  async (documentId) => {

    const response =
      await api.get(
        `/documents/${documentId}`
      );

    return response.data;
  };



// ========================================
// UPLOAD DOCUMENT
// ========================================

export const uploadDocument =
  async (documentData) => {

    const formData =
      new FormData();

    Object.entries(
      documentData
    ).forEach(([key, value]) => {

      if (
        value !== undefined &&
        value !== null
      ) {

        // arrays support
        if (Array.isArray(value)) {

          value.forEach((item) => {
            formData.append(key, item);
          });

        } else {

          formData.append(
            key,
            value
          );
        }
      }
    });

    const response =
      await api.post(
        "/documents",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return response.data;
  };



// ========================================
// UPDATE DOCUMENT
// ========================================

export const updateDocument =
  async (
    documentId,
    documentData
  ) => {

    const response =
      await api.put(
        `/documents/${documentId}`,
        documentData
      );

    return response.data;
  };



// ========================================
// ARCHIVE DOCUMENT
// ========================================

export const archiveDocument =
  async (documentId) => {

    const response =
      await api.patch(
        `/documents/${documentId}/archive`
      );

    return response.data;
  };



// ========================================
// RESTORE DOCUMENT
// ========================================

export const restoreDocument =
  async (documentId) => {

    const response =
      await api.patch(
        `/documents/${documentId}/restore`
      );

    return response.data;
  };



// ========================================
// DELETE DOCUMENT
// ========================================

export const deleteDocument =
  async (documentId) => {

    const response =
      await api.delete(
        `/documents/${documentId}`
      );

    return response.data;
  };



// ========================================
// DOWNLOAD DOCUMENT URL
// ========================================

export const getDocumentDownloadUrl =
  (filePath) => {

    if (!filePath) return "#";

    return `http://localhost:5000/${filePath}`;
  };
import api from "./api";

export const getInvoices = async () => {
  const { data } =
    await api.get("/invoices");

  return data;
};

export const getInvoiceById =
  async (id) => {
    const { data } =
      await api.get(
        `/invoices/${id}`
      );

    return data;
  };

export const createInvoice =
  async (payload) => {
    const { data } =
      await api.post(
        "/invoices",
        payload
      );

    return data;
  };

export const updateInvoice =
  async (id, payload) => {
    const { data } =
      await api.put(
        `/invoices/${id}`,
        payload
      );

    return data;
  };

export const deleteInvoice =
  async (id) => {
    const { data } =
      await api.delete(
        `/invoices/${id}`
      );

    return data;
  };

export const getUnbilledTasks =
  async (clientId) => {
    const { data } =
      await api.get(
        `/invoices/unbilled/${clientId}`
      );

    return data;
  };
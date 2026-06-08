import api from "./api";

export const getReportsAnalytics =
  async () => {
    const response =
      await api.get(
        "/reports/analytics"
      );

    return response.data;
  };
import api from "./axios";

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getCategoryDistribution: () => api.get("/dashboard/categories"),
  getStatusDistribution: () => api.get("/dashboard/statuses"),
  getRecentTickets: () => api.get("/dashboard/recent-tickets"),
  getTechnicianWorkload: () => api.get("/dashboard/workload"),
  getSlaAlerts: () => api.get("/dashboard/sla-alerts"),
  getReports: (params) => api.get("/dashboard/reports", { params }),
  downloadReport: (params) =>
    api.get("/dashboard/reports/download", {
      params,
      responseType: "blob",
    }),
};

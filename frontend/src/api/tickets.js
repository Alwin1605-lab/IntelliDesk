import api from "./axios";

export const ticketsAPI = {
  getAll: (params) => api.get("/tickets", { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post("/tickets", data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  assign: (id, technicianId) => api.put(`/tickets/${id}/assign`, { technicianId }),
  updateStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  escalate: (id, reason) => api.put(`/tickets/${id}/escalate`, { reason }),
  addComment: (id, comment) => api.post(`/tickets/${id}/comments`, comment),
  getComments: (id) => api.get(`/tickets/${id}/comments`),
  addAttachment: (id, formData) =>
    api.post(`/tickets/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getTimeline: (id) => api.get(`/tickets/${id}/timeline`),
  getMyTickets: (params) => api.get("/tickets/my", { params }),
  addNote: (id, note) => api.post(`/tickets/${id}/notes`, note),
};

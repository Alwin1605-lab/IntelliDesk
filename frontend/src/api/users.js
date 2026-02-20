import api from "./axios";

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getTechnicians: () => api.get("/users/technicians"),
  updateSkills: (id, skills) => api.put(`/users/${id}/skills`, { skills }),
};

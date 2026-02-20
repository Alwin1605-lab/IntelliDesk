import axios from "axios";

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatbotAPI = {
  sendMessage: (message) => aiApi.post("/chatbot/message", { message }),
  getSuggestions: (description) => aiApi.post("/chatbot/suggestions", { description }),
  predictPriority: (data) => aiApi.post("/chatbot/predict-priority", data),
  getFaqArticles: (query) => aiApi.get("/knowledge-base/search", { params: { query } }),
  getAllFaq: () => aiApi.get("/knowledge-base/articles"),
};

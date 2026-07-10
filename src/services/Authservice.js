import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Call this once after store is created to wire up the interceptor
export function setAuthInterceptor(getToken) {
  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export const authService = {
  register: (name, email, password) =>
    api.post("/v1/auth/register", { name, email, password }),

  login: (email, password) => api.post("/v1/auth/login", { email, password }),

  me: () => api.get("/v1/auth/me"),

  logout: () => api.post("/v1/auth/logout"),
};

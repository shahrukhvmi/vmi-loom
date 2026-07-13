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

export const videoService = {
  getUploadUrl: (title) => api.post("/v1/videos/upload-url", { title }),

  createShare: (videoUuid) => api.post(`/v1/videos/${videoUuid}/shares`),

  getVideo: (videoUuid) => api.get(`/v1/videos/${videoUuid}`),

  uploadVideo: (uploadUrl, blob, mimeType, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      const ext = mimeType?.includes("mp4") ? "mp4" : "webm";
      formData.append("file", blob, `recording.${ext}`);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(formData);
    });
  },
};

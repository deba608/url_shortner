import axios from "axios";
import { getToken, clearToken } from "@/utils/token";
import { ROUTES } from "@/utils/constants";

const resolveApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "";
  }

  const configured = import.meta.env.VITE_API_URL;
  if (!configured) {
    throw new Error("VITE_API_URL environment variable is not set");
  }
  const trimmed = configured.replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
};

const axiosClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    if (status === 401 || status === 403) {
      clearToken();
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.assign(ROUTES.LOGIN);
      }
    }

    return Promise.reject({ status, message, raw: error });
  }
);

export default axiosClient;

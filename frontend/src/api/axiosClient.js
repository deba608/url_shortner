import axios from "axios";
import { getToken, clearToken } from "@/utils/token";
import { ROUTES } from "@/utils/constants";

const resolveApiBaseUrl = () => {
  // In development: Vite proxy forwards all API paths to localhost:3000.
  // Return empty string → Axios uses same origin → proxy handles routing.
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "";
  }

  // In production (Vercel): VITE_API_URL must point to the Render API.
  // e.g. https://url-shortener-api.onrender.com
  const configured = import.meta.env.VITE_API_URL || "";
  return configured.replace(/\/+$/, "").replace(/\/api$/, "");
};

// One configured Axios instance for the whole app. Every API module imports
// THIS, never bare `axios`, so the base URL, auth header, and error handling
// are applied uniformly.
const axiosClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT as a Bearer token on every request (if present).
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors and handle global auth failures.
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

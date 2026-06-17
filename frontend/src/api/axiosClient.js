import axios from "axios";
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
  // Send the HTTP-only auth cookie on cross-origin requests (works when the API
  // is same-site or proxied; harmless otherwise since we also send a Bearer token).
  withCredentials: true,
});

// Attach the JWT as a Bearer token on every request (if present).
axiosClient.interceptors.request.use(async (config) => {
  if (window.Clerk && window.Clerk.session) {
    const token = await window.Clerk.session.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors and handle global auth failures.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    // Detect Vercel 405 Method Not Allowed when VITE_API_URL is missing
    if (status === 405 && !import.meta.env.DEV) {
      message = "Configuration Error: VITE_API_URL is missing. Please set it in your Vercel Environment Variables to point to your Render backend.";
    }

    if (status === 401) {
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.assign(ROUTES.LOGIN);
      }
    }

    return Promise.reject({ status, message, raw: error });
  }
);

export default axiosClient;

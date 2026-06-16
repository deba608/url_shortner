import axios from "axios";
import { getToken, clearToken } from "@/utils/token";

// One configured Axios instance for the whole app. Every API module imports
// THIS, never bare `axios`, so the base URL, auth header, and error handling
// are applied uniformly.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach the JWT (if present) as a Bearer token.
axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: normalise errors into a consistent shape and handle
// global concerns (expired/invalid token => force re-auth).
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Backend uses { error } for auth and { message } for the URL layer.
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    if (status === 401 || status === 403) {
      // Token missing/expired/invalid: drop it and bounce to login.
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject({ status, message, raw: error });
  }
);

export default axiosClient;

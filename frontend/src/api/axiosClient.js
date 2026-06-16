import axios from "axios";
import { getToken, clearToken } from "@/utils/token";

const resolveApiBaseUrl = () => {
  const productionApiUrl = "https://url-shortner-eceq.onrender.com";
  const configured =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? productionApiUrl : "http://localhost:3000");
  const trimmed = configured.replace(/\/+$/, "");

  if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
    return productionApiUrl;
  }

  // This Express backend exposes routes at /auth, /user, /shorten, etc.
  // A common Vercel mistake is setting VITE_API_URL to ".../api", which makes
  // login call /api/auth/login and breaks immediately after deployment.
  return trimmed.replace(/\/api$/, "");
};

// One configured Axios instance for the whole app. Every API module imports
// THIS, never bare `axios`, so the base URL, auth header, and error handling
// are applied uniformly.
const axiosClient = axios.create({
  baseURL: resolveApiBaseUrl(),
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

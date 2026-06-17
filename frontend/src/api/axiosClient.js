import axios from "axios";

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
  // Send the HTTP-only auth cookie on cross-origin requests
  withCredentials: true,
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

    // A 401 on a protected request means the session is gone/expired.
    // Send the user to the login page, but ignore the initial /me check
    // so we don't accidentally redirect public pages (like the homepage).
    const isMeCheck = error.config?.url?.includes("/api/auth/me");
    if (status === 401 && window.location.pathname !== "/login" && !isMeCheck) {
      window.location.assign("/login");
    }

    return Promise.reject({ status, message, raw: error });
  }
);

export default axiosClient;

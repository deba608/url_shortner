import axiosClient from "@/api/axiosClient";

// URL endpoints. The backend wraps successful payloads in { status, data },
// so we unwrap `.data.data` and hand callers the useful part.

// GET /user -> list of the caller's URLs (each includes a ready-made shortUrl).
export const getUserUrls = async () => {
  const { data } = await axiosClient.get("/user");
  return data.data;
};

// POST /shorten -> { shortCode, shortUrl, expiresAt }
// Body: { url, customAlias?, expiresIn?, expiresAt? }
export const createShortUrl = async (payload) => {
  const { data } = await axiosClient.post("/shorten", payload);
  return data.data;
};

// GET /urls/:id/analytics -> aggregated analytics (used in Phase 5).
export const getUrlAnalytics = async (id) => {
  const { data } = await axiosClient.get(`/urls/${id}/analytics`);
  return data.data;
};

// GET /urls/:id/qrcode -> { shortCode, shortUrl, qrCode } (base64 data URL).
export const getUrlQrCode = async (id) => {
  const { data } = await axiosClient.get(`/urls/${id}/qrcode`);
  return data.data;
};

// DELETE /urls/:id -> { id, shortCode }
export const deleteUrl = async (id) => {
  const { data } = await axiosClient.delete(`/urls/${id}`);
  return data.data;
};

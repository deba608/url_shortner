import axiosClient from "@/api/axiosClient";

// Rewrite the backend's shortUrl to use the frontend's current domain (window.location.origin)
// so that generated links are clean and branded to the Vercel deployment.
// Redirection is then handled by the frontend Redirect route (/:shortCode).

export const getUserUrls = async (config) => {
  const { data } = await axiosClient.get("/user", config);
  return data.data.map((url) => ({
    ...url,
    shortUrl: `${window.location.origin}/${url.shortCode}`,
  }));
};

export const createShortUrl = async (payload) => {
  const { data } = await axiosClient.post("/shorten", payload);
  return {
    ...data.data,
    shortUrl: `${window.location.origin}/${data.data.shortCode}`,
  };
};

export const getUrlAnalytics = async (id, config) => {
  const { data } = await axiosClient.get(`/urls/${id}/analytics`, config);
  return data.data;
};

export const getUrlQrCode = async (id, params = {}) => {
  const { data } = await axiosClient.get(`/urls/${id}/qrcode`, { params });
  return {
    ...data.data,
    shortUrl: `${window.location.origin}/${data.data.shortCode}`,
  };
};

// png/svg formats return a raw binary body. Fetch as a blob through the
// authenticated axios client (an <img src> to the API can't send the auth token
// and breaks cross-origin), then the caller turns it into an object URL.
export const getUrlQrCodeBlob = async (id, params = {}) => {
  const res = await axiosClient.get(`/urls/${id}/qrcode`, { params, responseType: "blob" });
  return res.data; // Blob
};

export const deleteUrl = async (id) => {
  const { data } = await axiosClient.delete(`/urls/${id}`);
  return data.data;
};

export const updateOriginalUrl = async (id, originalUrl) => {
  const { data } = await axiosClient.patch(`/urls/${id}`, { originalUrl });
  return data.data;
};

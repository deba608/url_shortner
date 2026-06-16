import axiosClient from "@/api/axiosClient";

// Trust the backend's shortUrl as-is — it's built from the API's own BASE_URL
// env var, which is the correct domain for the link to redirect through.
// (Previously this was rewritten to `${window.location.origin}/...`, which
// silently replaced the real short link with the frontend's own domain —
// breaking every generated link in production.)

export const getUserUrls = async (config) => {
  const { data } = await axiosClient.get("/user", config);
  return data.data;
};

export const createShortUrl = async (payload) => {
  const { data } = await axiosClient.post("/shorten", payload);
  return data.data;
};

export const getUrlAnalytics = async (id, config) => {
  const { data } = await axiosClient.get(`/urls/${id}/analytics`, config);
  return data.data;
};

export const getUrlQrCode = async (id) => {
  const { data } = await axiosClient.get(`/urls/${id}/qrcode`);
  return data.data;
};

export const deleteUrl = async (id) => {
  const { data } = await axiosClient.delete(`/urls/${id}`);
  return data.data;
};

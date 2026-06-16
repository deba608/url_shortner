import axiosClient from "@/api/axiosClient";

const rewriteShortUrl = (url) => ({
  ...url,
  shortUrl: `${window.location.origin}/${url.shortCode}`,
});

export const getUserUrls = async (config) => {
  const { data } = await axiosClient.get("/user", config);
  return data.data.map(rewriteShortUrl);
};

export const createShortUrl = async (payload) => {
  const { data } = await axiosClient.post("/shorten", payload);
  return rewriteShortUrl(data.data);
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

import axiosClient from "@/api/axiosClient";

// Auth endpoints. Each returns the parsed response body and lets errors
// propagate (already normalised by the axiosClient response interceptor).

// POST /auth/register -> { message, userId }
export const registerRequest = async ({ email, password }) => {
  const { data } = await axiosClient.post("/auth/register", { email, password });
  return data;
};

// POST /auth/login -> { token, userId }
export const loginRequest = async ({ email, password }) => {
  const { data } = await axiosClient.post("/auth/login", { email, password });
  return data;
};

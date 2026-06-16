import { TOKEN_KEY } from "@/utils/constants";

// Thin wrapper around localStorage for the JWT. Keeping reads/writes behind
// these helpers means we can swap the storage mechanism (e.g. to cookies) in
// exactly one place later.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

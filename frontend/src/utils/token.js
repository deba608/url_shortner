import { TOKEN_KEY } from "@/utils/constants";

// JWT storage. "Remember me" controls persistence:
//   remember=true  -> localStorage  (survives browser restart)
//   remember=false -> sessionStorage (cleared when the tab closes)
// Reads check both so the rest of the app doesn't care which was used.
export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

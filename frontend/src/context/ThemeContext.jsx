import { createContext, useMemo } from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const value = useMemo(() => ({ theme: "dark" }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

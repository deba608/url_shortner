import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AppRoutes from "@/routes/AppRoutes";

// App shell. AuthProvider must sit inside BrowserRouter because auth flows use
// router hooks (navigate/redirect). ThemeProvider + React Query layer in later.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

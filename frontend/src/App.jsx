import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";

// App shell. Providers (AuthContext, ThemeContext, React Query) wrap <AppRoutes/>
// here as they're added in later phases.
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

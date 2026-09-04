import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import PropertyDetail from "@/pages/PropertyDetail";
import Favorites from "@/pages/Favorites";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { SettingsProvider } from "@/context/SettingsContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

function AppShell() {
  const { pathname } = useLocation();
  const hideHeader = pathname.startsWith("/admin/dashboard");
  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bien/:id" element={<PropertyDetail />} />
        <Route path="/favoris" element={<Favorites />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      <footer className="border-t border-slate-100 mt-16 py-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} The Casa — Immobilier au Gabon
      </footer>
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <SettingsProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <AppShell />
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </FavoritesProvider>
      </SettingsProvider>
    </div>
  );
}

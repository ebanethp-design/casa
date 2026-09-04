import { Link, useNavigate } from "react-router-dom";
import { Heart, Home as HomeIcon } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function Header() {
  const { settings } = useSettings();
  const nav = useNavigate();
  return (
    <header className="glass-header sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-5">
        <Link to="/" className="flex items-center gap-2 group" data-testid="header-home-link">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <HomeIcon size={18} />
          </div>
          <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {settings.site_name}
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            data-testid="favorites-btn"
            onClick={() => nav("/favoris")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Favoris</span>
          </button>
          <Link
            to="/admin"
            data-testid="admin-link"
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--brand)" }}
          >
            Espace admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

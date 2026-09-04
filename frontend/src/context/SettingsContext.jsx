import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const SettingsContext = createContext({
  settings: { site_name: "The Casa", accent_color: "#1E5E3F", tagline: "" },
  refresh: () => {},
});

function hexToHSL(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "149 51% 24%";
  let [r, g, b] = m.map((v) => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    site_name: "The Casa",
    accent_color: "#1E5E3F",
    tagline: "Trouvez votre chez-vous au Gabon",
  });

  const applyAccent = useCallback((hex) => {
    const root = document.documentElement;
    root.style.setProperty("--brand", hex);
    root.style.setProperty("--primary", hexToHSL(hex));
    root.style.setProperty("--ring", hexToHSL(hex));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings(data);
      if (data.site_name) document.title = data.site_name;
      if (data.accent_color) applyAccent(data.accent_color);
    } catch (e) {
      console.error(e);
    }
  }, [applyAccent]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

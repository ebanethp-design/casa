import { createContext, useContext, useEffect, useState, useCallback } from "react";

const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

const KEY = "casa_favorites";

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) { /* noop */ }
  }, []);

  const persist = (next) => {
    setFavorites(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

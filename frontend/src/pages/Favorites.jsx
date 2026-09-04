import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { useFavorites } from "@/context/FavoritesContext";

export default function Favorites() {
  const { favorites } = useFavorites();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(favorites.map((id) => api.get(`/properties/${id}`).then((r) => r.data).catch(() => null)))
      .then((all) => setItems(all.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [favorites]);

  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="text-rose-500" />
        <h1 className="text-3xl md:text-4xl font-semibold">Mes favoris</h1>
      </div>
      {loading ? (
        <div className="text-slate-500">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="py-16 border border-dashed rounded-2xl text-center text-slate-500">
          Vous n'avez encore aucun favori. <Link to="/" className="underline">Découvrir les annonces</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </main>
  );
}

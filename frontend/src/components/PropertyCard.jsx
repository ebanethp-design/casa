import { Link } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin } from "lucide-react";
import { formatXAF } from "@/lib/api";
import { useFavorites } from "@/context/FavoritesContext";

export default function PropertyCard({ property }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(property.id);
  const priceLabel = property.transaction_type === "location" ? "/mois" : "";
  return (
    <Link to={`/bien/${property.id}`} data-testid={`property-card-${property.id}`} className="block">
      <article className="casa-card group h-full flex flex-col">
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={property.images?.[0]}
            alt={property.title}
            className="cover w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {property.transaction_type === "location" ? "Location" : "Vente"}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-white/90 text-slate-800">
              {property.property_type}
            </span>
          </div>
          <button
            type="button"
            data-testid={`like-btn-${property.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(property.id);
            }}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              liked ? "bg-white text-rose-600" : "bg-white/80 text-slate-700 hover:bg-white"
            }`}
            aria-label="Ajouter aux favoris"
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
            <MapPin size={12} />
            <span>{property.neighborhood}, {property.city}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 leading-snug mb-2 line-clamp-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {property.title}
          </h3>
          <div className="flex items-center gap-4 text-slate-500 text-sm mt-auto pt-3">
            <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>
            <span className="flex items-center gap-1"><Maximize size={14} /> {property.area_m2} m²</span>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-baseline gap-1">
            <span className="text-xl font-bold" style={{ color: "var(--brand)" }}>
              {formatXAF(property.price)}
            </span>
            {priceLabel && <span className="text-xs text-slate-500">{priceLabel}</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}

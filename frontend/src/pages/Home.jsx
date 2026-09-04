import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import api from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { useSettings } from "@/context/SettingsContext";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TRANSACTIONS = [
  { value: "all", label: "Tous" },
  { value: "location", label: "Location" },
  { value: "vente", label: "Vente" },
];
const TYPES = [
  { value: "all", label: "Tous types" },
  { value: "Maison", label: "Maison" },
  { value: "Appartement", label: "Appartement" },
];

export default function Home() {
  const { settings } = useSettings();
  const [properties, setProperties] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "", city: "all", neighborhood: "all", transaction_type: "all", property_type: "all",
  });

  useEffect(() => {
    api.get("/properties/cities").then(({ data }) => setCityData(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.city !== "all") params.city = filters.city;
    if (filters.neighborhood !== "all") params.neighborhood = filters.neighborhood;
    if (filters.transaction_type !== "all") params.transaction_type = filters.transaction_type;
    if (filters.property_type !== "all") params.property_type = filters.property_type;
    setLoading(true);
    api.get("/properties", { params })
      .then(({ data }) => setProperties(data))
      .finally(() => setLoading(false));
  }, [filters]);

  const neighborhoods = useMemo(() => {
    if (filters.city === "all") return [];
    const c = cityData.find((x) => x.city === filters.city);
    return c?.neighborhoods || [];
  }, [cityData, filters.city]);

  const resetFilters = () => setFilters({
    q: "", city: "all", neighborhood: "all", transaction_type: "all", property_type: "all",
  });

  const hasActive = filters.q || filters.city !== "all" || filters.neighborhood !== "all"
    || filters.transaction_type !== "all" || filters.property_type !== "all";

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Villa moderne au Gabon"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/70 to-slate-900/40" />
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(1200px 500px at 20% 20%, rgba(30,94,63,0.55), transparent 60%)" }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-14 md:pt-28 md:pb-20">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white mb-6 backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              Immobilier · Gabon
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.05] drop-shadow-sm">
              {settings.tagline || "Trouvez votre chez-vous au Gabon"}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed">
              Parcourez des centaines d'annonces vérifiées, filtrez par ville et quartier, et contactez sans compte.
            </p>
          </div>

          {/* Filters */}
          <div className="mt-10 bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="filter-search"
                  placeholder="Rechercher (quartier, mot-clé...)"
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
              <Select value={filters.city} onValueChange={(v) => setFilters((f) => ({ ...f, city: v, neighborhood: "all" }))}>
                <SelectTrigger data-testid="filter-city" className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Ville" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cityData.map((c) => <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.neighborhood} onValueChange={(v) => setFilters((f) => ({ ...f, neighborhood: v }))} disabled={filters.city === "all"}>
                <SelectTrigger data-testid="filter-neighborhood" className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Quartier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous quartiers</SelectItem>
                  {neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select value={filters.transaction_type} onValueChange={(v) => setFilters((f) => ({ ...f, transaction_type: v }))}>
                  <SelectTrigger data-testid="filter-transaction" className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {TRANSACTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.property_type} onValueChange={(v) => setFilters((f) => ({ ...f, property_type: v }))}>
                  <SelectTrigger data-testid="filter-type" className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Bien" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActive && (
              <div className="mt-3 flex justify-end">
                <Button data-testid="reset-filters" variant="ghost" size="sm" onClick={resetFilters} className="text-slate-600">
                  <X size={14} className="mr-1" /> Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Annonces récentes</h2>
          <span data-testid="results-count" className="text-sm text-slate-500">
            {loading ? "..." : `${properties.length} résultat${properties.length > 1 ? "s" : ""}`}
          </span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 text-slate-500 border border-dashed border-slate-200 rounded-2xl">
            <SlidersHorizontal className="mx-auto mb-3" />
            Aucune annonce ne correspond à vos filtres.
          </div>
        ) : (
          <div data-testid="listings-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </main>
  );
}

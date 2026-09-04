import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Heart, Check, Phone, Mail, User } from "lucide-react";
import api, { formatXAF } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFavorites } from "@/context/FavoritesContext";

export default function PropertyDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", message: "" });
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    setLoading(true);
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => nav("/"))
      .finally(() => setLoading(false));
  }, [id, nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.phone || !form.email) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/interests", {
        ...form,
        property_id: property.id,
        property_title: property.title,
      });
      toast.success("Votre demande a bien été envoyée. Nous vous recontactons rapidement.");
      setDialogOpen(false);
      nav("/");
    } catch (err) {
      toast.error("Impossible d'envoyer la demande. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 text-slate-500">Chargement…</div>;
  if (!property) return null;

  const liked = isFavorite(property.id);
  const [main, ...rest] = property.images || [];
  const others = rest.slice(0, 4);

  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6" data-testid="back-home">
        <ArrowLeft size={16} /> Retour aux annonces
      </Link>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        <div className="md:col-span-2 rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100">
          {main && <img src={main} alt={property.title} className="w-full h-full object-cover" />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          {others.map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-slate-100 aspect-[4/3] md:aspect-[16/9]">
              <img src={src} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Info */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="casa-chip">{property.transaction_type === "location" ? "Location" : "Vente"}</span>
                <span className="casa-chip">{property.property_type}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">{property.title}</h1>
              <div className="mt-3 flex items-center gap-1 text-slate-500">
                <MapPin size={14} /> {property.neighborhood}, {property.city}
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(property.id)}
              data-testid="detail-like-btn"
              className={`shrink-0 w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${liked ? "bg-rose-50 border-rose-200 text-rose-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              aria-label="Favoris"
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex items-center gap-6 text-slate-700 py-5 border-y border-slate-100 mb-6">
            <span className="flex items-center gap-2"><Bed size={18} /> {property.bedrooms} chambres</span>
            <span className="flex items-center gap-2"><Bath size={18} /> {property.bathrooms} sdb</span>
            <span className="flex items-center gap-2"><Maximize size={18} /> {property.area_m2} m²</span>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 mb-3">Description</h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">{property.description}</p>

          {property.features?.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Équipements</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-8">
                {property.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-700">
                    <Check size={16} style={{ color: "var(--brand)" }} /> {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Sticky CTA */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
            <div className="text-3xl font-bold" style={{ color: "var(--brand)" }}>
              {formatXAF(property.price)}
              {property.transaction_type === "location" && <span className="text-sm text-slate-500 font-normal"> /mois</span>}
            </div>
            <p className="mt-2 text-sm text-slate-500">Sans engagement — réponse rapide.</p>
            <Button
              data-testid="open-interest-form"
              onClick={() => setDialogOpen(true)}
              className="mt-5 w-full h-12 rounded-full text-white font-semibold hover:opacity-95 transition-opacity"
              style={{ backgroundColor: "var(--brand)" }}
            >
              Je suis intéressé(e)
            </Button>
            <p className="mt-3 text-xs text-slate-500 text-center">Aucun compte requis</p>
          </div>
        </aside>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Demande d'information</DialogTitle>
            <p className="text-sm text-slate-500 pt-1">Pour : <span className="font-medium text-slate-800">{property.title}</span></p>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 pt-2" data-testid="interest-form">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet *</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="form-name" id="name" required className="pl-9 h-11" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact préféré *</Label>
              <Input data-testid="form-contact" id="contact" required placeholder="WhatsApp / Appel / Email" className="h-11" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone *</Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input data-testid="form-phone" id="phone" required className="pl-9 h-11" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input data-testid="form-email" id="email" type="email" required className="pl-9 h-11" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea data-testid="form-message" id="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button
              type="submit"
              data-testid="submit-interest"
              disabled={submitting}
              className="w-full h-12 rounded-full text-white font-semibold"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {submitting ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Trash2, Edit, EyeOff, Eye, Plus, Home as HomeIcon, Users, Settings as SettingsIcon, Search } from "lucide-react";
import api, { formatXAF } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CITIES = ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Lambaréné"];

const emptyProp = {
  title: "", description: "", property_type: "Maison", transaction_type: "location",
  city: "Libreville", neighborhood: "", price: 0, bedrooms: 1, bathrooms: 1, area_m2: 50,
  features: [], images: [], hidden: false,
};

export default function AdminDashboard() {
  const nav = useNavigate();
  const { settings, refresh } = useSettings();
  const [properties, setProperties] = useState([]);
  const [interests, setInterests] = useState([]);
  const [propSearch, setPropSearch] = useState("");
  const [propDialog, setPropDialog] = useState({ open: false, editing: null, form: emptyProp });
  const [interestDialog, setInterestDialog] = useState({ open: false, form: { name: "", contact: "", phone: "", email: "", message: "" } });
  const [siteForm, setSiteForm] = useState({ site_name: "", accent_color: "#1E5E3F", tagline: "" });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(() => setChecking(false)).catch(() => nav("/admin"));
  }, [nav]);

  useEffect(() => { setSiteForm({ site_name: settings.site_name || "", accent_color: settings.accent_color || "#1E5E3F", tagline: settings.tagline || "" }); }, [settings]);

  const loadProps = () => api.get("/admin/properties").then(({ data }) => setProperties(data));
  const loadInterests = () => api.get("/admin/interests").then(({ data }) => setInterests(data));

  useEffect(() => { if (!checking) { loadProps(); loadInterests(); } }, [checking]);

  const logout = () => { localStorage.removeItem("casa_token"); nav("/admin"); };

  const filteredProps = useMemo(() => {
    if (!propSearch) return properties;
    const q = propSearch.toLowerCase();
    return properties.filter((p) => p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.neighborhood.toLowerCase().includes(q));
  }, [propSearch, properties]);

  const openNewProp = () => setPropDialog({ open: true, editing: null, form: emptyProp });
  const openEditProp = (p) => setPropDialog({
    open: true, editing: p.id,
    form: { ...p, features: p.features || [], images: p.images || [] },
  });

  const saveProp = async () => {
    const f = propDialog.form;
    if (!f.title || !f.city || !f.neighborhood) { toast.error("Champs requis manquants"); return; }
    const body = {
      ...f,
      price: Number(f.price), bedrooms: Number(f.bedrooms), bathrooms: Number(f.bathrooms), area_m2: Number(f.area_m2),
      features: typeof f.features === "string" ? f.features.split(",").map(s => s.trim()).filter(Boolean) : f.features,
      images: typeof f.images === "string" ? f.images.split(/\n|,/).map(s => s.trim()).filter(Boolean) : f.images,
    };
    try {
      if (propDialog.editing) await api.put(`/admin/properties/${propDialog.editing}`, body);
      else await api.post("/admin/properties", body);
      toast.success("Enregistré");
      setPropDialog({ open: false, editing: null, form: emptyProp });
      loadProps();
    } catch { toast.error("Erreur lors de l'enregistrement"); }
  };

  const toggleHide = async (p) => {
    await api.put(`/admin/properties/${p.id}`, { hidden: !p.hidden });
    loadProps();
  };
  const removeProp = async (p) => {
    if (!window.confirm(`Supprimer "${p.title}" ?`)) return;
    await api.delete(`/admin/properties/${p.id}`);
    toast.success("Supprimé");
    loadProps();
  };
  const removeInterest = async (i) => {
    if (!window.confirm(`Supprimer la demande de ${i.name} ?`)) return;
    await api.delete(`/admin/interests/${i.id}`);
    loadInterests();
  };
  const saveInterest = async () => {
    try {
      await api.post("/admin/interests", interestDialog.form);
      toast.success("Ajouté");
      setInterestDialog({ open: false, form: { name: "", contact: "", phone: "", email: "", message: "" } });
      loadInterests();
    } catch { toast.error("Vérifiez les champs (email valide requis)"); }
  };
  const saveSettings = async () => {
    try {
      await api.put("/admin/settings", siteForm);
      await refresh();
      toast.success("Paramètres mis à jour");
    } catch { toast.error("Erreur"); }
  };

  if (checking) return <div className="p-16 text-slate-500">Vérification…</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez vos annonces, demandes et l'apparence du site.</p>
        </div>
        <Button data-testid="admin-logout" onClick={logout} variant="outline" className="rounded-full">
          <LogOut size={16} className="mr-2" /> Déconnexion
        </Button>
      </div>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="rounded-full bg-slate-100 p-1">
          <TabsTrigger data-testid="tab-properties" value="properties" className="rounded-full data-[state=active]:bg-white"><HomeIcon size={14} className="mr-1.5" />Annonces ({properties.length})</TabsTrigger>
          <TabsTrigger data-testid="tab-interests" value="interests" className="rounded-full data-[state=active]:bg-white"><Users size={14} className="mr-1.5" />Demandes ({interests.length})</TabsTrigger>
          <TabsTrigger data-testid="tab-settings" value="settings" className="rounded-full data-[state=active]:bg-white"><SettingsIcon size={14} className="mr-1.5" />Paramètres</TabsTrigger>
        </TabsList>

        {/* Properties */}
        <TabsContent value="properties" className="mt-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input data-testid="admin-search-properties" placeholder="Rechercher..." className="pl-9 h-10 rounded-xl" value={propSearch} onChange={(e) => setPropSearch(e.target.value)} />
            </div>
            <Button data-testid="admin-new-property" onClick={openNewProp} className="rounded-full text-white" style={{ backgroundColor: "var(--brand)" }}>
              <Plus size={16} className="mr-1.5" /> Nouvelle annonce
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Titre</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProps.map((p) => (
                  <tr key={p.id} data-testid={`admin-prop-row-${p.id}`} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800 max-w-xs truncate">{p.title}</td>
                    <td className="p-3 text-slate-600">{p.city} · {p.neighborhood}</td>
                    <td className="p-3 text-slate-600">{p.property_type} · {p.transaction_type}</td>
                    <td className="p-3 text-slate-800 font-medium">{formatXAF(p.price)}</td>
                    <td className="p-3">
                      {p.hidden
                        ? <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Masqué</span>
                        : <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Actif</span>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button data-testid={`admin-toggle-hide-${p.id}`} onClick={() => toggleHide(p)} title={p.hidden ? "Afficher" : "Masquer"} className="p-2 text-slate-500 hover:text-slate-900">
                        {p.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button data-testid={`admin-edit-${p.id}`} onClick={() => openEditProp(p)} className="p-2 text-slate-500 hover:text-slate-900"><Edit size={16} /></button>
                      <button data-testid={`admin-delete-${p.id}`} onClick={() => removeProp(p)} className="p-2 text-slate-500 hover:text-rose-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Interests */}
        <TabsContent value="interests" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button data-testid="admin-new-interest" onClick={() => setInterestDialog({ ...interestDialog, open: true })} className="rounded-full text-white" style={{ backgroundColor: "var(--brand)" }}>
              <Plus size={16} className="mr-1.5" /> Ajouter une demande
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3">Bien</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interests.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune demande pour le moment.</td></tr>
                )}
                {interests.map((i) => (
                  <tr key={i.id} data-testid={`admin-interest-row-${i.id}`} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3 text-slate-600">{i.email}</td>
                    <td className="p-3 text-slate-600">{i.phone}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{i.property_title || "-"}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(i.created_at).toLocaleString("fr-FR")}</td>
                    <td className="p-3 text-right">
                      <button data-testid={`admin-delete-interest-${i.id}`} onClick={() => removeInterest(i)} className="p-2 text-slate-500 hover:text-rose-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-1">Apparence du site</h2>
            <p className="text-sm text-slate-500 mb-6">Personnalisez le nom, le slogan et la couleur d'accent.</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du site</Label>
                <Input data-testid="settings-site-name" value={siteForm.site_name} onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Slogan</Label>
                <Input data-testid="settings-tagline" value={siteForm.tagline} onChange={(e) => setSiteForm({ ...siteForm, tagline: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Couleur d'accent</Label>
                <div className="flex items-center gap-3">
                  <input data-testid="settings-color-picker" type="color" value={siteForm.accent_color} onChange={(e) => setSiteForm({ ...siteForm, accent_color: e.target.value })} className="w-14 h-11 rounded-xl border border-slate-200 bg-white cursor-pointer" />
                  <Input value={siteForm.accent_color} onChange={(e) => setSiteForm({ ...siteForm, accent_color: e.target.value })} className="h-11 max-w-[160px]" />
                  <div className="rounded-xl px-4 py-2 text-white text-sm font-semibold" style={{ backgroundColor: siteForm.accent_color }}>Aperçu</div>
                </div>
              </div>
              <Button data-testid="settings-save" onClick={saveSettings} className="rounded-full text-white" style={{ backgroundColor: "var(--brand)" }}>Enregistrer</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Property dialog */}
      <Dialog open={propDialog.open} onOpenChange={(o) => setPropDialog({ ...propDialog, open: o })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{propDialog.editing ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Titre *</Label>
              <Input data-testid="prop-title" value={propDialog.form.title} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, title: e.target.value } })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={propDialog.form.description} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, description: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type de transaction</Label>
              <Select value={propDialog.form.transaction_type} onValueChange={(v) => setPropDialog({ ...propDialog, form: { ...propDialog.form, transaction_type: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="vente">Vente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de bien</Label>
              <Select value={propDialog.form.property_type} onValueChange={(v) => setPropDialog({ ...propDialog, form: { ...propDialog.form, property_type: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Appartement">Appartement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Select value={propDialog.form.city} onValueChange={(v) => setPropDialog({ ...propDialog, form: { ...propDialog.form, city: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quartier *</Label>
              <Input value={propDialog.form.neighborhood} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, neighborhood: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={propDialog.form.price} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, price: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Surface (m²)</Label>
              <Input type="number" value={propDialog.form.area_m2} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, area_m2: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Chambres</Label>
              <Input type="number" value={propDialog.form.bedrooms} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, bedrooms: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Salles de bain</Label>
              <Input type="number" value={propDialog.form.bathrooms} onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, bathrooms: e.target.value } })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Équipements (séparés par des virgules)</Label>
              <Input value={Array.isArray(propDialog.form.features) ? propDialog.form.features.join(", ") : propDialog.form.features}
                onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, features: e.target.value } })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Images (URLs, une par ligne)</Label>
              <Textarea rows={3} value={Array.isArray(propDialog.form.images) ? propDialog.form.images.join("\n") : propDialog.form.images}
                onChange={(e) => setPropDialog({ ...propDialog, form: { ...propDialog.form, images: e.target.value } })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropDialog({ open: false, editing: null, form: emptyProp })}>Annuler</Button>
            <Button data-testid="prop-save" onClick={saveProp} className="text-white" style={{ backgroundColor: "var(--brand)" }}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interest dialog */}
      <Dialog open={interestDialog.open} onOpenChange={(o) => setInterestDialog({ ...interestDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une demande</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input data-testid="new-interest-name" placeholder="Nom" value={interestDialog.form.name} onChange={(e) => setInterestDialog({ ...interestDialog, form: { ...interestDialog.form, name: e.target.value } })} />
            <Input placeholder="Contact préféré" value={interestDialog.form.contact} onChange={(e) => setInterestDialog({ ...interestDialog, form: { ...interestDialog.form, contact: e.target.value } })} />
            <Input placeholder="Téléphone" value={interestDialog.form.phone} onChange={(e) => setInterestDialog({ ...interestDialog, form: { ...interestDialog.form, phone: e.target.value } })} />
            <Input type="email" placeholder="Email" value={interestDialog.form.email} onChange={(e) => setInterestDialog({ ...interestDialog, form: { ...interestDialog.form, email: e.target.value } })} />
            <Textarea placeholder="Message" value={interestDialog.form.message} onChange={(e) => setInterestDialog({ ...interestDialog, form: { ...interestDialog.form, message: e.target.value } })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterestDialog({ ...interestDialog, open: false })}>Annuler</Button>
            <Button data-testid="new-interest-save" onClick={saveInterest} className="text-white" style={{ backgroundColor: "var(--brand)" }}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

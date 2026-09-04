import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@thecasa.ga");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("casa_token", data.token);
      toast.success("Connexion réussie");
      nav("/admin/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--brand)" }}>
            <Lock className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Espace administrateur</h1>
          <p className="text-sm text-slate-500 mt-1">Connectez-vous pour gérer les annonces et les demandes.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="admin-login-form">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input data-testid="admin-email-input" id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <Input data-testid="admin-password-input" id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </div>
            <Button
              type="submit"
              data-testid="admin-login-submit"
              disabled={loading}
              className="w-full h-11 rounded-full text-white font-semibold"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
          <p className="mt-6 text-xs text-slate-400 text-center">Identifiants par défaut : admin@thecasa.ga / admin123</p>
        </div>
      </div>
    </main>
  );
}

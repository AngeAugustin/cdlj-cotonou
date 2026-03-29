"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Phone,
  Hash,
  Shield,
  Church,
  MapPin,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ApiProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  numero?: string;
  roles: string[];
  parishId?:
    | { _id: string; name: string; vicariatId?: { _id: string; name: string; abbreviation?: string } }
    | string
    | null;
  vicariatId?: { _id: string; name: string; abbreviation?: string } | string | null;
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super administrateur",
  DIOCESAIN: "Diocésain",
  VICARIAL: "Vicarial",
  PAROISSIAL: "Paroissial",
};

function initialsFromName(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function parishLabel(p: ApiProfile["parishId"]): string {
  if (p && typeof p === "object" && "name" in p) return p.name;
  return "—";
}

function vicariatLabel(u: ApiProfile): string {
  const v = u.vicariatId;
  if (v && typeof v === "object" && "name" in v && v.name) return v.name;
  const p = u.parishId;
  if (p && typeof p === "object" && p.vicariatId) {
    const pv = p.vicariatId;
    if (typeof pv === "object" && "name" in pv && pv.name) return pv.name;
  }
  return "—";
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-amber-900" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-slate-900 font-semibold mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/me");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error ?? "Impossible de charger le profil");
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch {
      setLoadError("Erreur réseau");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: "err", text: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdMessage({ type: "err", text: data.error ?? "Échec du changement" });
        return;
      }
      setPwdMessage({ type: "ok", text: "Mot de passe mis à jour avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwdMessage({ type: "err", text: "Erreur réseau" });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-slate-600">{loadError ?? "Profil introuvable"}</p>
        <Button className="mt-4" variant="outline" onClick={() => loadProfile()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const rolesText = profile.roles.map((r) => ROLE_LABELS[r] ?? r).join(" · ");

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Mon profil</h1>
        <p className="text-slate-500 mt-2">Vos informations de compte et la sécurité de votre accès.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900/90 to-slate-900/90 px-8 py-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white/20 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-white text-2xl font-bold">
              {initialsFromName(profile.firstName, profile.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-white min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight truncate">{fullName}</h2>
            <p className="text-amber-200/90 font-medium mt-1 truncate">{profile.email}</p>
            <p className="text-sm text-white/70 mt-2">{rolesText}</p>
          </div>
        </div>

        <div className="px-8 py-2">
          <InfoRow icon={Phone} label="Téléphone" value={profile.phone?.trim() ? profile.phone : "—"} />
          <InfoRow icon={Hash} label="Numéro utilisateur" value={profile.numero ?? "—"} />
          <InfoRow icon={Shield} label="Rôles" value={rolesText} />
          <InfoRow icon={Church} label="Paroisse" value={parishLabel(profile.parishId)} />
          <InfoRow icon={MapPin} label="Vicariat" value={vicariatLabel(profile)} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mot de passe</h3>
            <p className="text-sm text-slate-500">Modifiez votre mot de passe de connexion.</p>
          </div>
        </div>

        <form onSubmit={submitPassword} className="space-y-5 max-w-md">
          {pwdMessage && (
            <p
              className={`text-sm font-medium rounded-xl px-4 py-3 ${
                pwdMessage.type === "ok"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                  : "bg-red-50 text-red-800 border border-red-100"
              }`}
            >
              {pwdMessage.text}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 h-11 rounded-xl border-slate-200"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 h-11 rounded-xl border-slate-200"
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">Au moins 8 caractères.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-xl border-slate-200"
              minLength={8}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={pwdSaving}
            className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold h-11 px-8 shadow-lg shadow-amber-900/20"
          >
            {pwdSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer le nouveau mot de passe"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

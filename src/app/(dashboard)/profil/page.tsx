"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Phone,
  Hash,
  Church,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Mail,
  User,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardPageShell } from "@/components/dashboard/page-shell";

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

const ROLE_STYLES: Record<string, string> = {
  SUPERADMIN: "bg-purple-500/20 text-purple-100 border-purple-400/30",
  DIOCESAIN: "bg-amber-400/20 text-amber-100 border-amber-300/30",
  VICARIAL: "bg-sky-400/20 text-sky-100 border-sky-300/30",
  PAROISSIAL: "bg-emerald-400/20 text-emerald-100 border-emerald-300/30",
};

const HERO_AMBER_BG = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-amber-950" />
    <div className="absolute inset-0 bg-gradient-to-tr from-amber-700/20 via-transparent to-amber-500/10 pointer-events-none" />
    <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
    <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-800/30 blur-[70px] pointer-events-none" />
  </>
);

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

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-900/10 border border-amber-900/10">
        <Icon className="w-4 h-4 text-amber-900" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-slate-500 mt-0.5">{description}</p> : null}
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  accent = "amber",
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "amber" | "blue" | "green" | "slate";
  className?: string;
}) {
  const accents = {
    amber: "from-amber-50 to-amber-100/50 border-amber-100/80 text-amber-900",
    blue: "from-sky-50 to-sky-100/50 border-sky-100/80 text-sky-700",
    green: "from-emerald-50 to-emerald-100/50 border-emerald-100/80 text-emerald-700",
    slate: "from-slate-50 to-slate-100/50 border-slate-100/80 text-slate-700",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/80 pointer-events-none" />
      <div className="relative flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-sm ${accents[accent]}`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1.5 text-base font-bold text-slate-900 leading-snug break-words">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show?: boolean;
  onToggleShow?: () => void;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700 font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show !== undefined && !show ? "password" : "text"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-xl border-slate-200 bg-slate-50/80 pl-4 pr-11 text-sm focus:bg-white focus:border-amber-900/30 focus:ring-amber-900/15"
          minLength={minLength}
          required
        />
        {onToggleShow ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-amber-900 hover:bg-amber-50 transition-colors"
            onClick={onToggleShow}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-150" />
          <Loader2 className="relative w-10 h-10 animate-spin text-amber-900" />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement de votre profil…</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
          <User className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-slate-600 font-medium">{loadError ?? "Profil introuvable"}</p>
        <Button className="mt-5 rounded-xl" variant="outline" onClick={() => loadProfile()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <DashboardPageShell
      title="Mon profil"
      description="Consultez vos informations de compte et gérez la sécurité de votre accès."
    >
      <div className="space-y-6">
        {/* Hero profil */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-800/20 shadow-xl shadow-amber-900/10">
          {HERO_AMBER_BG}

          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              <div className="relative shrink-0 self-start sm:self-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl scale-110" />
                <Avatar className="relative h-24 w-24 sm:h-28 sm:w-28 border-[3px] border-amber-300/30 shadow-2xl shadow-amber-950/40">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-amber-50 text-2xl sm:text-3xl font-extrabold">
                    {initialsFromName(profile.firstName, profile.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90 mb-3">
                  <Sparkles className="w-3 h-3" />
                  Espace personnel
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-50 tracking-tight truncate">
                  {fullName}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-amber-200/85 font-medium truncate">
                  <Mail className="w-4 h-4 shrink-0 text-amber-300/80" />
                  {profile.email}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${ROLE_STYLES[role] ?? "bg-white/10 text-amber-100 border-white/20"}`}
                    >
                      {ROLE_LABELS[role] ?? role}
                    </span>
                  ))}
                </div>
              </div>

              {profile.numero ? (
                <div className="shrink-0 self-start sm:self-center rounded-2xl border border-amber-400/20 bg-amber-950/40 backdrop-blur-sm px-5 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/70">N° utilisateur</p>
                  <p className="mt-1 text-xl font-black text-amber-50 tabular-nums">{profile.numero}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Informations */}
          <div className="xl:col-span-3 space-y-5">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/20">
              <SectionHeader
                icon={User}
                title="Informations personnelles"
                description="Coordonnées et rattachement ecclésial de votre compte."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoTile
                  icon={Phone}
                  label="Téléphone"
                  value={profile.phone?.trim() ? profile.phone : "—"}
                  accent="amber"
                />
                <InfoTile
                  icon={Hash}
                  label="Numéro utilisateur"
                  value={profile.numero ?? "—"}
                  accent="slate"
                />
                <InfoTile
                  icon={Church}
                  label="Paroisse"
                  value={parishLabel(profile.parishId)}
                  accent="green"
                />
                <InfoTile
                  icon={MapPin}
                  label="Vicariat"
                  value={vicariatLabel(profile)}
                  accent="blue"
                />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="xl:col-span-2">
            <div className="xl:sticky xl:top-24 rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="relative overflow-hidden px-6 py-5 border-b border-amber-800/20">
                {HERO_AMBER_BG}
                <div className="relative flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 backdrop-blur-sm">
                    <Lock className="w-5 h-5 text-amber-300" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-amber-50">Sécurité du compte</h3>
                    <p className="text-xs text-amber-200/75 mt-0.5">Modifiez votre mot de passe de connexion</p>
                  </div>
                </div>
              </div>

              <form onSubmit={submitPassword} className="p-6 sm:p-7 space-y-5">
                {pwdMessage ? (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                      pwdMessage.type === "ok"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : "bg-red-50 text-red-800 border-red-100"
                    }`}
                  >
                    {pwdMessage.text}
                  </div>
                ) : null}

                <PasswordField
                  id="current-password"
                  label="Mot de passe actuel"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((s) => !s)}
                  autoComplete="current-password"
                />

                <PasswordField
                  id="new-password"
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggleShow={() => setShowNew((s) => !s)}
                  autoComplete="new-password"
                  minLength={8}
                  hint="Au moins 8 caractères."
                />

                <PasswordField
                  id="confirm-password"
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showNew}
                  autoComplete="new-password"
                  minLength={8}
                />

                <Button
                  type="submit"
                  disabled={pwdSaving}
                  className="w-full rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold h-12 shadow-lg shadow-amber-900/20 transition-all hover:shadow-xl hover:shadow-amber-900/25"
                >
                  {pwdSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Mettre à jour le mot de passe
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  );
}

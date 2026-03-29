"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Hash,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Church,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AVAILABLE_ROLES = ["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"] as const;

type ApiUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  numero?: string;
  roles: string[];
  parishId?:
    | { _id: string; name: string; vicariatId?: { _id: string; name: string; abbreviation?: string } | string }
    | string
    | null;
  vicariatId?: { _id: string; name: string; abbreviation?: string } | string | null;
};

type ParoisseOpt = {
  _id: string;
  name: string;
  vicariatId: string;
  vicariat?: { name: string; abbreviation?: string };
};

type VicariatOpt = { _id: string; name: string; abbreviation: string };

function refId(
  v: { _id: string } | string | null | undefined
): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v._id;
}

function parishLabel(u: ApiUser): string {
  const p = u.parishId;
  if (p && typeof p === "object" && "name" in p) return p.name;
  return "—";
}

function vicariatLabel(u: ApiUser, vicariats: VicariatOpt[]): string {
  const v = u.vicariatId;
  if (v && typeof v === "object" && "name" in v && v.name) return v.name;
  const idFrom = (x: unknown) => (typeof x === "string" ? x : x && typeof x === "object" && "_id" in x ? String((x as { _id: string })._id) : "");
  if (typeof v === "string" && v) {
    const want = idFrom(v);
    const hit = vicariats.find((x) => String(x._id) === want);
    if (hit) return hit.name;
  }
  const p = u.parishId;
  if (p && typeof p === "object" && p.vicariatId) {
    const pv = p.vicariatId;
    if (typeof pv === "object" && "name" in pv && pv.name) return pv.name;
    const want = idFrom(pv);
    if (want) {
      const hit = vicariats.find((x) => String(x._id) === want);
      if (hit) return hit.name;
    }
  }
  return "—";
}

export default function UtilisateursPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const isSuperAdmin = roles.includes("SUPERADMIN");

  const [usersList, setUsersList] = useState<ApiUser[]>([]);
  const [paroisses, setParoisses] = useState<ParoisseOpt[]>([]);
  const [vicariats, setVicariats] = useState<VicariatOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayNumero, setDisplayNumero] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [paroisseId, setParoisseId] = useState("");

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const [ur, pr, vr] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/paroisses"),
        fetch("/api/vicariats"),
      ]);
      if (ur.ok) setUsersList(await ur.json());
      else showToast("Impossible de charger les utilisateurs", "error");
      if (pr.ok) setParoisses(await pr.json());
      if (vr.ok) setVicariats(await vr.json());
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (!isSuperAdmin) {
      router.replace("/dashboard");
      return;
    }
    loadAll();
  }, [session, status, isSuperAdmin, router, loadAll]);

  const sortedParoisses = useMemo(
    () => [...paroisses].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [paroisses]
  );
  const selectedParoisse = useMemo(
    () => sortedParoisses.find((p) => p._id === paroisseId),
    [sortedParoisses, paroisseId]
  );
  const derivedVicariatLabel = useMemo(() => {
    if (!selectedParoisse) return "—";
    if (selectedParoisse.vicariat?.name) return selectedParoisse.vicariat.name;
    const vid = selectedParoisse.vicariatId;
    if (vid) {
      const v = vicariats.find((x) => String(x._id) === String(vid));
      if (v) return `${v.name} (${v.abbreviation})`;
    }
    return "—";
  }, [selectedParoisse, vicariats]);

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      const next = selectedRoles.filter((r) => r !== role);
      if (next.length === 0) {
        showToast("Au moins un rôle est requis", "error");
        return;
      }
      setSelectedRoles(next);
    } else {
      if (selectedRoles.length >= 3) {
        showToast("Maximum 3 rôles (TDR)", "error");
        return;
      }
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const openModalForCreate = () => {
    setEditUserId(null);
    setNom("");
    setPrenom("");
    setEmail("");
    setPhone("");
    setPassword("");
    setDisplayNumero("Attribué à l’enregistrement");
    setSelectedRoles(["PAROISSIAL"]);
    setParoisseId(sortedParoisses[0]?._id ?? "");
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: ApiUser) => {
    setEditUserId(user._id);
    setDisplayNumero(user.numero || "—");
    setNom(user.lastName);
    setPrenom(user.firstName);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setPassword("");
    setSelectedRoles([...user.roles]);
    setParoisseId(refId(user.parishId));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && !/^01\d{8}$/.test(phone)) {
      showToast("Le téléphone doit faire 10 chiffres et commencer par 01.", "error");
      return;
    }
    if (!nom.trim() || !prenom.trim() || !email.trim() || selectedRoles.length === 0) {
      showToast("Nom, prénom, email et au moins un rôle sont requis.", "error");
      return;
    }
    if (editUserId && password.trim() && password.length < 8) {
      showToast("Le mot de passe doit faire au moins 8 caractères.", "error");
      return;
    }
    if (!paroisseId.trim()) {
      showToast("Choisissez une paroisse de rattachement (obligatoire pour tout compte).", "error");
      return;
    }

    const body: Record<string, unknown> = {
      firstName: prenom.trim(),
      lastName: nom.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      roles: selectedRoles,
      paroisseId: paroisseId.trim(),
    };

    if (editUserId && password.trim()) {
      body.password = password;
    }

    setSaving(true);
    try {
      const url = editUserId ? `/api/users/${editUserId}` : "/api/users";
      const method = editUserId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(err.error ?? "Erreur", "error");
        return;
      }
      showToast(editUserId ? "Utilisateur mis à jour" : "Utilisateur créé et email envoyé");
      setIsModalOpen(false);
      loadAll();
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteUserId}`, { method: "DELETE" });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(err.error ?? "Erreur", "error");
        return;
      }
      showToast("Utilisateur supprimé");
      setDeleteUserId(null);
      loadAll();
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      `${u.lastName} ${u.firstName}`.toLowerCase().includes(q) ||
      (u.numero ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q)
    );
  });

  if (status === "loading" || (loading && usersList.length === 0 && isSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="w-full space-y-8 relative pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Utilisateurs &amp; rôles</h1>
          <p className="text-slate-500 mt-2 text-lg max-w-2xl">
            Création, modification, suppression et attribution des rôles (TDR — SuperAdmin).{" "}
            <span className="text-slate-800 font-semibold">
              Chaque utilisateur doit être rattaché à une paroisse
            </span>{" "}
            : le vicariat est enregistré automatiquement à partir de cette paroisse, quel que soit le ou les rôles. À la
            création, un mot de passe temporaire est généré puis envoyé par e-mail.
          </p>
        </div>
        <Button
          onClick={openModalForCreate}
          className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouvel utilisateur
        </Button>
      </div>

      {usersList.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par nom, numéro, email ou téléphone…"
              className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden min-h-[400px]">
        {filteredUsers.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Shield className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun utilisateur</h3>
            <p className="text-slate-500 max-w-md mb-6">
              Créez des comptes avec nom, prénoms, numéro, téléphone, email et jusqu’à trois rôles. Le mot de passe
              temporaire est généré automatiquement puis envoyé par e-mail.
            </p>
            <Button
              onClick={openModalForCreate}
              variant="outline"
              className="px-6 rounded-xl border-slate-200 text-amber-900 font-bold hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter un utilisateur
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                  <th className="p-5 font-semibold">Identité</th>
                  <th className="p-5 font-semibold hidden lg:table-cell">Rattachement</th>
                  <th className="p-5 font-semibold hidden md:table-cell">Contact</th>
                  <th className="p-5 font-semibold">Rôles</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-amber-900 bg-amber-100 shrink-0">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-base">
                            {user.lastName} {user.firstName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            {user.numero ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2 font-medium">
                          <Church className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{parishLabel(user)}</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{vicariatLabel(user, vicariats)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {user.phone || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              role === "SUPERADMIN"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : role === "DIOCESAIN"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : role === "VICARIAL"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openModalForEdit(user)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteUserId(user._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold text-slate-900 truncate">
                    {editUserId ? "Modifier l’utilisateur" : "Créer un utilisateur"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">SuperAdmin — TDR IV</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Numéro (TDR)</Label>
                  <div className="font-mono font-bold text-amber-900 text-lg tracking-widest truncate">{displayNumero}</div>
                </div>
                <div className="p-2 bg-amber-900/10 text-amber-900 rounded-lg shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="h-12 rounded-xl uppercase"
                    placeholder="Nom de famille"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prénom(s)</Label>
                  <Input
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Prénom(s)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const only = e.target.value.replace(/\D/g, "");
                        setPhone(only.substring(0, 10));
                      }}
                      maxLength={10}
                      className="h-12 pl-11 rounded-xl"
                      placeholder="01XXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-11 rounded-xl"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              </div>

              {editUserId ? (
                <div className="space-y-2">
                  <Label>Nouveau mot de passe (optionnel)</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Laisser vide pour conserver"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-slate-700">
                  Un mot de passe temporaire de <span className="font-bold text-slate-900">8 caractères alphanumériques</span>{" "}
                  sera généré automatiquement et envoyé à l’adresse e-mail renseignée après la création du compte.
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <Label>
                    Paroisse de rattachement <span className="text-red-600">*</span>
                  </Label>
                  <select
                    required
                    value={paroisseId}
                    onChange={(e) => setParoisseId(e.target.value)}
                    className="w-full h-12 mt-1.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none"
                  >
                    <option value="">— Choisir une paroisse —</option>
                    {sortedParoisses.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                        {p.vicariat?.name ? ` — ${p.vicariat.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-800">Vicariat enregistré : </span>
                  <span className="text-slate-700">{derivedVicariatLabel}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-bold">Rôles (max. 3)</Label>
                  <span className="text-xs font-bold text-slate-400">{selectedRoles.length}/3</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    const isDisabled = !isSelected && selectedRoles.length >= 3;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => !isDisabled && handleRoleToggle(role)}
                        disabled={isDisabled}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-amber-900 bg-amber-50"
                            : isDisabled
                              ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                              : "border-slate-100 hover:border-amber-900/30 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                            isSelected ? "bg-amber-900 border-amber-900 text-white" : "bg-white border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? "text-amber-900" : "text-slate-600"}`}>
                          {role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <Button type="button" variant="ghost" className="h-12 rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving || selectedRoles.length === 0}
                className="h-12 px-8 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editUserId ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent className="rounded-3xl" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-center">
              Cette action supprime définitivement le compte. Les rôles seront révoqués.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteUserId(null)}>
              Annuler
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border pointer-events-none ${
            toast.type === "success"
              ? "bg-slate-900 border-slate-800 text-white"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

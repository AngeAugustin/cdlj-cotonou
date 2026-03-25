"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Download,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Banknote,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────
type Activite = {
  _id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
  delaiPaiement: string;
  numeroPaiement?: string;
  image?: string;
  terminee: boolean;
};

type LecteurRow = {
  _id: string;
  nom: string;
  prenoms: string;
  uniqueId: string;
  dateNaissance?: string;
  gradeId?: { name?: string; abbreviation?: string } | null;
};

type ParticipantRow = {
  paidAt: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    dateNaissance?: string;
  };
  grade?: { name?: string; abbreviation?: string } | null;
};

type Toast = { message: string; type: "success" | "error" };

function isoToDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

function isoToDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function ageFromBirth(iso?: string) {
  if (!iso) return "—";
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return "—";
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return `${a} ans`;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const line = (r: (string | number)[]) => r.map((x) => esc(String(x))).join(";");
  const content = [line(header), ...rows.map(line)].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────
export default function ActivitesPage() {
  const { data: session } = useSession();
  const roles: string[] = (session?.user as any)?.roles ?? [];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isSuperAdmin = roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");

  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /** Onglet principal : en cours vs passées/terminées */
  const [mainTab, setMainTab] = useState<"encours" | "passees">("encours");

  // ── Admin : formulaire ──
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fnom, setFnom] = useState("");
  const [fdebut, setFdebut] = useState("");
  const [ffin, setFfin] = useState("");
  const [flieu, setFlieu] = useState("");
  const [fmontant, setFmontant] = useState("");
  const [fnumeroPaiement, setFnumeroPaiement] = useState("");
  const [fdelai, setFdelai] = useState("");
  const [fimage, setFimage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [termineeTarget, setTermineeTarget] = useState<Activite | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

  // ── Paroissial : participer ──
  const [partAct, setPartAct] = useState<Activite | null>(null);
  const [partSubTab, setPartSubTab] = useState<"non" | "oui">("non");
  const [lecteurs, setLecteurs] = useState<LecteurRow[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);
  const [selectedPay, setSelectedPay] = useState<Record<string, boolean>>({});
  const [partLoading, setPartLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [participantsRows, setParticipantsRows] = useState<ParticipantRow[]>([]);

  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activites");
      if (res.ok) setActivites(await res.json());
      else showToast("Impossible de charger les activités", "error");
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivites();
  }, [fetchActivites]);

  const filtered = useMemo(() => {
    return activites.filter((a) => (mainTab === "encours" ? !a.terminee : a.terminee));
  }, [activites, mainTab]);

  const openCreate = () => {
    setEditId(null);
    setFnom("");
    setFdebut("");
    setFfin("");
    setFlieu("");
    setFmontant("");
    setFnumeroPaiement("");
    setFdelai("");
    setFimage("");
    setFormOpen(true);
  };

  const openEdit = (a: Activite) => {
    setEditId(a._id);
    setFnom(a.nom);
    setFdebut(isoToDateInput(a.dateDebut));
    setFfin(isoToDateInput(a.dateFin));
    setFlieu(a.lieu);
    setFmontant(String(a.montant));
    setFnumeroPaiement(a.numeroPaiement ?? "");
    setFdelai(isoToDatetimeLocal(a.delaiPaiement));
    setFimage(a.image ?? "");
    setFormOpen(true);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setFimage(data.url);
        showToast("Image téléversée");
      } else showToast(data.error ?? "Échec du téléversement", "error");
    } catch {
      showToast("Échec du téléversement", "error");
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fnom.trim() || !fdebut || !ffin || !flieu.trim() || !fmontant || !fnumeroPaiement.trim() || !fdelai) {
      showToast("Remplissez tous les champs obligatoires", "error");
      return;
    }
    setSubmitting(true);
    const payload = {
      nom: fnom.trim(),
      dateDebut: new Date(fdebut).toISOString(),
      dateFin: new Date(ffin).toISOString(),
      lieu: flieu.trim(),
      montant: Number(fmontant),
      delaiPaiement: new Date(fdelai).toISOString(),
      numeroPaiement: fnumeroPaiement.trim(),
      image: fimage.trim() || undefined,
    };
    try {
      const url = editId ? `/api/activites/${editId}` : "/api/activites";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editId ? "Activité mise à jour" : "Activité créée");
        setFormOpen(false);
        fetchActivites();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activites/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Activité supprimée");
        setDeleteId(null);
        fetchActivites();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setDeleting(false);
    }
  };

  const marquerTerminee = async (id: string) => {
    setMarkingDone(true);
    try {
      const res = await fetch(`/api/activites/${id}/terminer`, { method: "PATCH" });
      if (res.ok) {
        showToast("Activité marquée comme terminée");
        fetchActivites();
        setTermineeTarget(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setMarkingDone(false);
    }
  };

  const openParticiper = async (a: Activite) => {
    setPartAct(a);
    setPartSubTab("non");
    setSelectedPay({});
    setPartLoading(true);
    try {
      const [lr, pr] = await Promise.all([
        fetch("/api/lecteurs"),
        fetch(`/api/activites/${a._id}/participations`),
      ]);
      const L: LecteurRow[] = lr.ok ? await lr.json() : [];
      const P: ParticipantRow[] = pr.ok ? await pr.json() : [];
      setLecteurs(L);
      setParticipantsRows(P);
      setPartIds(P.map((x) => x.lecteur._id));
    } catch {
      setLecteurs([]);
      setPartIds([]);
      setParticipantsRows([]);
    } finally {
      setPartLoading(false);
    }
  };

  const nonParticipants = useMemo(() => {
    const setP = new Set(partIds);
    return lecteurs.filter((l) => !setP.has(l._id));
  }, [lecteurs, partIds]);

  const togglePay = (id: string) => {
    setSelectedPay((s) => ({ ...s, [id]: !s[id] }));
  };

  const submitPayer = async () => {
    if (!partAct) return;
    const ids = Object.entries(selectedPay)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) {
      showToast("Cochez au moins un lecteur", "error");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/activites/${partAct._id}/participations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecteurIds: ids }),
      });
      if (res.ok) {
        showToast("Participation enregistrée (paiement à intégrer ultérieurement)");
        setSelectedPay({});
        const pr = await fetch(`/api/activites/${partAct._id}/participations`);
        if (pr.ok) {
          const P: ParticipantRow[] = await pr.json();
          setParticipantsRows(P);
          setPartIds(P.map((x) => x.lecteur._id));
        }
        if (partSubTab === "oui") setPartSubTab("oui");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Erreur", "error");
      }
    } catch {
      showToast("Erreur inattendue", "error");
    } finally {
      setPaying(false);
    }
  };

  const downloadCurrentParticipants = () => {
    if (!partAct) return;
    const header = ["Matricule", "Nom", "Prénoms", "Grade", "Âge"];
    const rows = participantsRows.map((p) => [
      p.lecteur.uniqueId,
      p.lecteur.nom,
      p.lecteur.prenoms,
      p.grade?.name || p.grade?.abbreviation || "—",
      ageFromBirth(p.lecteur.dateNaissance),
    ]);
    downloadCsv(`participants-encours-${partAct.nom.slice(0, 30)}.csv`, header, rows);
  };

  const TabBtn = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-amber-900 text-white shadow-lg shadow-amber-900/25"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );

  const ActivityRow = ({ a }: { a: Activite }) => (
    <div className="px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors group">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden relative bg-slate-100 mt-0.5">
        {a.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
            <Activity className="w-5 h-5 text-amber-300" />
          </div>
        )}
      </div>

      {/* Texte + actions sur la même ligne (actions à droite) */}
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-[13px] font-semibold text-slate-900 leading-snug truncate">{a.nom}</h4>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${
                a.terminee
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-800 border border-amber-100"
              }`}
            >
              {!a.terminee && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              {a.terminee ? "Terminée" : "En cours"}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {format(new Date(a.dateDebut), "d MMM", { locale: fr })}
              {" → "}
              {format(new Date(a.dateFin), "d MMM yyyy", { locale: fr })}
            </span>
            {a.lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {a.lieu}
              </span>
            )}
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <Banknote className="w-3 h-3 shrink-0" />
              {a.montant === 0 ? "Gratuit" : formatMoney(a.montant)}
            </span>
          </div>
        </div>

        {/* Actions : même bandeau que le texte, à droite */}
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
          <Link
            href={`/activites/${a._id}`}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "rounded-xl")}
            title="Détails"
            aria-label="Détails de l’activité"
          >
            <Eye className="size-3.5" />
          </Link>
          {isManager && (
            <>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="rounded-xl"
                title="Modifier"
                aria-label="Modifier l’activité"
                onClick={() => openEdit(a)}
              >
                <Pencil className="size-3.5" />
              </Button>
              {isSuperAdmin && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  title="Supprimer"
                  aria-label="Supprimer l’activité"
                  onClick={() => setDeleteId(a._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              {!a.terminee && (
                <Button
                  type="button"
                  size="icon-sm"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                  title="Marquer comme terminée"
                  aria-label="Marquer comme terminée"
                  onClick={() => setTermineeTarget(a)}
                >
                  <CheckCircle className="size-3.5" />
                </Button>
              )}
            </>
          )}
          {isParoissial && !a.terminee && (
            <Button
              type="button"
              size="icon-sm"
              className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white"
              title="Participer"
              aria-label="Participer"
              onClick={() => openParticiper(a)}
            >
              <UserPlus className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-12">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Activités</h1>
          <p className="text-slate-500 mt-2 text-lg">
            {isManager
              ? "Créez et pilotez les activités diocésaines."
              : isVicarial
                ? "Suivez les activités et la participation des paroisses de votre vicariat."
                : "Consultez les activités et enregistrez la participation de vos lecteurs."}
          </p>
        </div>
        {isManager && (
          <Button
            type="button"
            onClick={openCreate}
            className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20 shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" /> Créer une activité
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <TabBtn active={mainTab === "encours"} onClick={() => setMainTab("encours")}>
          {isManager ? "En cours" : "Activités en cours"}
        </TabBtn>
        <TabBtn active={mainTab === "passees"} onClick={() => setMainTab("passees")}>
          {isManager ? "Terminées" : "Activités passées"}
        </TabBtn>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 py-24 flex flex-col items-center justify-center text-center">
          <Activity className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-xl font-bold text-slate-900">Aucune activité dans cette catégorie</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            {mainTab === "encours"
              ? "Il n’y a pas d’activité en cours pour le moment."
              : "Aucune activité terminée ou passée à afficher."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map((a) => (
              <ActivityRow key={a._id} a={a} />
            ))}
          </div>
        </div>
      )}

      {/* ── Formulaire admin ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier l’activité" : "Créer une activité"}</DialogTitle>
            <DialogDescription>
              Nom, dates, lieu, montant, numéro de paiement, délai de paiement et visuel (TDR — rôle diocésain).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <Label htmlFor="fnom">Nom de l’activité</Label>
              <Input id="fnom" value={fnom} onChange={(e) => setFnom(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fdebut">Date de début</Label>
                <Input id="fdebut" type="date" value={fdebut} onChange={(e) => setFdebut(e.target.value)} className="rounded-xl mt-1.5" />
              </div>
              <div>
                <Label htmlFor="ffin">Date de fin</Label>
                <Input id="ffin" type="date" value={ffin} onChange={(e) => setFfin(e.target.value)} className="rounded-xl mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="flieu">Lieu</Label>
              <Input id="flieu" value={flieu} onChange={(e) => setFlieu(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label htmlFor="fmontant">Montant (FCFA)</Label>
              <Input id="fmontant" type="number" min={0} value={fmontant} onChange={(e) => setFmontant(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label htmlFor="fnumeroPaiement">Numéro de paiement</Label>
              <Input
                id="fnumeroPaiement"
                value={fnumeroPaiement}
                onChange={(e) => setFnumeroPaiement(e.target.value)}
                placeholder="Ex. compte mobile money, référence bancaire…"
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="fdelai">Délai de paiement</Label>
              <Input id="fdelai" type="datetime-local" value={fdelai} onChange={(e) => setFdelai(e.target.value)} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label>Image de l’activité</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <Input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="rounded-xl cursor-pointer" />
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-amber-900" />}
              </div>
              {fimage && (
                <p className="text-xs text-slate-500 mt-2 truncate">Image : {fimage}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Suppression ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer cette activité ?</DialogTitle>
            <DialogDescription>Les participations associées seront également supprimées.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" className="rounded-xl" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation : activité terminée ── */}
      <Dialog open={!!termineeTarget} onOpenChange={(o) => !o && setTermineeTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Marquer cette activité comme terminée ?</DialogTitle>
            <DialogDescription>
              {termineeTarget
                ? `L’activité "${termineeTarget.nom}" sera déplacée dans les activités terminées.`
                : "Cette action est irréversible."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setTermineeTarget(null)}
              disabled={markingDone}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => termineeTarget && marquerTerminee(termineeTarget._id)}
              disabled={!termineeTarget || markingDone}
            >
              {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Paroissial : participer ── */}
      <Dialog open={!!partAct} onOpenChange={(o) => !o && setPartAct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
          {partAct && (
            <>
              <DialogHeader>
                <DialogTitle>Participer — {partAct.nom}</DialogTitle>
                <DialogDescription>
                  Enregistrez les lecteurs participants (le paiement effectif sera branché plus tard).
                </DialogDescription>
              </DialogHeader>
              {(partAct.numeroPaiement?.trim() || partAct.montant != null) && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-slate-800 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-900">Montant : </span>
                    {formatMoney(partAct.montant)}
                  </p>
                  {partAct.numeroPaiement?.trim() ? (
                    <p>
                      <span className="font-semibold text-slate-900">Numéro de paiement : </span>
                      <span className="font-mono">{partAct.numeroPaiement}</span>
                    </p>
                  ) : null}
                </div>
              )}
              <div className="flex gap-2">
                <TabBtn active={partSubTab === "non"} onClick={() => setPartSubTab("non")}>
                  Non participants
                </TabBtn>
                <TabBtn active={partSubTab === "oui"} onClick={() => setPartSubTab("oui")}>
                  Participants
                </TabBtn>
              </div>
              {partLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
                </div>
              ) : partSubTab === "non" ? (
                <div className="space-y-3">
                  {nonParticipants.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">Tous vos lecteurs sont déjà inscrits.</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-2">
                      {nonParticipants.map((l) => (
                        <li key={l._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={!!selectedPay[l._id]}
                            onChange={() => togglePay(l._id)}
                            className="w-4 h-4 rounded border-slate-300 text-amber-900 focus:ring-amber-900"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">
                              {l.nom} {l.prenoms}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(l.gradeId as any)?.name || (l.gradeId as any)?.abbreviation || "—"} · {ageFromBirth(l.dateNaissance)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button type="button" className="w-full rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold" disabled={paying} onClick={submitPayer}>
                    {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Payer"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={downloadCurrentParticipants} disabled={!participantsRows.length}>
                      <Download className="w-4 h-4 mr-1" /> Télécharger la liste
                    </Button>
                  </div>
                  {participantsRows.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">Aucun participant pour le moment.</p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-2">
                      {participantsRows.map((p) => (
                        <li key={p.lecteur._id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {p.lecteur.nom} {p.lecteur.prenoms}
                            </p>
                            <p className="text-xs text-slate-600">{p.lecteur.uniqueId}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle,
  Activity,
  Users,
  FileSpreadsheet,
  FileText,
  Banknote,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

type StatsPayload = {
  totalLecteurs: number;
  totalParticipants: number;
  byParoisse: {
    paroisseId: string;
    paroisseName: string;
    vicariatName?: string;
    count: number;
  }[];
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

type PaiementRow = {
  _id: string;
  createdAt?: string;
  status: string;
  montantTotal: number;
  montantUnitaire: number;
  nombreLecteurs: number;
  fedapayReference?: string | null;
  paroisseName?: string;
  userEmail?: string;
  lecteurs?: { _id: string; nom: string; prenoms: string; uniqueId: string }[];
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
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

function safeExportFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim().slice(0, 48) || "activite";
}

function formatPaidAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

function buildParticipantExportTable(participants: ParticipantRow[]) {
  const header = ["Matricule", "Nom", "Prénoms", "Grade", "Âge", "Date de paiement"];
  const rows = participants.map((p) => [
    p.lecteur.uniqueId,
    p.lecteur.nom,
    p.lecteur.prenoms,
    p.grade?.name || p.grade?.abbreviation || "—",
    ageFromBirth(p.lecteur.dateNaissance),
    formatPaidAt(p.paidAt),
  ]);
  return { header, rows };
}

/** Téléchargement direct dans le dossier Téléchargements (sans ouvrir un onglet ni « Enregistrer sous »). */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function ActiviteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = usePromise(params);
  const activiteId = resolvedParams.id;
  const { data: session, status } = useSession();
  const roles: string[] = ((session?.user as any)?.roles ?? []) as string[];
  const isManager = roles.includes("DIOCESAIN") || roles.includes("SUPERADMIN");
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activite, setActivite] = useState<Activite | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const [confirmTermineeOpen, setConfirmTermineeOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const [tab, setTab] = useState<"infos" | "participation" | "paiements">("infos");
  const [paiements, setPaiements] = useState<PaiementRow[]>([]);
  const [paiementsLoading, setPaiementsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [meData, setMeData] = useState<{ paroisseName?: string; vicariatName?: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!activiteId) return;
    setLoading(true);
    setLoadError(null);

    void fetch(`/api/activites/${encodeURIComponent(activiteId)}`)
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (!data?._id) throw new Error(data?.error ?? "Impossible de charger l'activité");
        setActivite(data as Activite);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [status, activiteId]);

  useEffect(() => {
    if (!activite) return;
    if (!(isManager || isVicarial)) return;
    setStatsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/stats`)
      .then((r) => r.json().catch(() => ({})))
      .then((data) => setStats(data as StatsPayload))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [activite, isManager, isVicarial]);

  /** Données paroisse/vicariat de l’utilisateur paroissial (pour le PDF). */
  useEffect(() => {
    if (!isParoissial) return;
    void fetch("/api/me")
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        const paroisseName =
          data?.parishId && typeof data.parishId === "object" ? data.parishId.name : undefined;
        const vicariatName =
          data?.vicariatId && typeof data.vicariatId === "object"
            ? data.vicariatId.name
            : data?.parishId?.vicariatId && typeof data.parishId.vicariatId === "object"
              ? data.parishId.vicariatId.name
              : undefined;
        setMeData({ paroisseName, vicariatName });
      })
      .catch(() => {});
  }, [isParoissial]);

  /** Liste des participants paroisse : dès que l’activité est chargée (pas seulement si terminée). */
  useEffect(() => {
    if (!activite || !isParoissial) return;
    setParticipantsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/participations`)
      .then((r) => r.json().catch(() => ([])))
      .then((data) => setParticipants(Array.isArray(data) ? (data as ParticipantRow[]) : []))
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  }, [activite, isParoissial]);

  useEffect(() => {
    if (!activite || tab !== "paiements") return;
    if (!isManager && !isVicarial && !isParoissial) return;
    setPaiementsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/paiements`)
      .then((r) => r.json().catch(() => ([])))
      .then((data) => setPaiements(Array.isArray(data) ? (data as PaiementRow[]) : []))
      .catch(() => setPaiements([]))
      .finally(() => setPaiementsLoading(false));
  }, [activite, tab, isManager, isVicarial, isParoissial]);

  const participationRate = useMemo(() => {
    if (!stats || !stats.totalLecteurs) return 0;
    return Math.round((stats.totalParticipants / stats.totalLecteurs) * 100);
  }, [stats]);

  const terminerActivite = async () => {
    if (!activite) return;
    setTerminating(true);
    try {
      const res = await fetch(`/api/activites/${encodeURIComponent(activite._id)}/terminer`, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erreur");
      }
      setActivite((prev) => (prev ? { ...prev, terminee: true } : prev));
      setConfirmTermineeOpen(false);
      showToast("Activité marquée comme terminée");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setTerminating(false);
    }
  };

  const downloadParticipantsExcel = () => {
    if (!activite || !participants.length) return;
    const { header, rows } = buildParticipantExportTable(participants);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    const base = safeExportFileName(activite.nom);
    const filename = `participants-${base}.xlsx`;
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    triggerBrowserDownload(blob, filename);
  };

  const downloadParticipantsPdf = async () => {
    if (!activite || !participants.length) return;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    // ── Load logos as base64 ─────────────────────────────────
    async function toDataUrl(url: string): Promise<string | null> {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    }
    const [logoEM, logoCDLJ] = await Promise.all([
      toDataUrl("https://i.postimg.cc/zGGW7CSV/EM.png"),
      toDataUrl("https://i.postimg.cc/BnnDpTc2/CDLJ.png"),
    ]);

    // ── Colour palette ───────────────────────────────────────
    const C = {
      amber900: [120, 53, 15] as [number, number, number],
      amber400: [245, 158, 11] as [number, number, number],
      amber50:  [255, 251, 235] as [number, number, number],
      slate200: [226, 232, 240] as [number, number, number],
      slate400: [148, 163, 184] as [number, number, number],
      slate500: [100, 116, 139] as [number, number, number],
      slate900: [15,  23,  42 ] as [number, number, number],
      white:    [255, 255, 255] as [number, number, number],
    };

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();   // 297
    const H = doc.internal.pageSize.getHeight();  // 210

    // ── Reusable header renderer ─────────────────────────────
    // Height: ~26mm
    function drawPageHeader() {
      // Amber top accent
      doc.setFillColor(...C.amber900);
      doc.rect(0, 0, W, 1.5, "F");

      // White header band (22mm — reduced from 26)
      doc.setFillColor(...C.white);
      doc.rect(0, 1.5, W, 22, "F");

      // Logos — EM enlarged (22), CDLJ unchanged (18)
      const lEM = 22;
      const lCDLJ = 18;
      if (logoEM)   doc.addImage(logoEM,   "PNG",  8,            1.5, lEM,   lEM);
      if (logoCDLJ) doc.addImage(logoCDLJ, "PNG", W - 8 - lCDLJ, 3,   lCDLJ, lCDLJ);

      // Org name
      doc.setFontSize(7.5);
      doc.setTextColor(...C.slate500);
      doc.setFont("helvetica", "normal");
      doc.text("Aumônerie de l'Enfance Missionnaire de Cotonou", W / 2, 8.5, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(...C.amber900);
      doc.setFont("helvetica", "bold");
      doc.text("Communauté Diocésaine des Lecteurs Juniors (CDLJ)", W / 2, 15.5, { align: "center" });

      // Paroisse / vicariat (si utilisateur paroissial)
      if (meData?.paroisseName || meData?.vicariatName) {
        const parts = [
          meData.vicariatName ? `Vicariat : ${meData.vicariatName}` : null,
          meData.paroisseName ? `Paroisse : ${meData.paroisseName}` : null,
        ].filter(Boolean).join("   |   ");
        doc.setFontSize(7);
        doc.setTextColor(...C.slate500);
        doc.setFont("helvetica", "normal");
        doc.text(parts, W / 2, 21.5, { align: "center" });
      }

      // Tricolor stripe
      doc.setFillColor(...C.amber400);  doc.rect(0, 23.5, W, 0.8, "F");
      doc.setFillColor(...C.slate200);  doc.rect(0, 24.3, W, 0.8, "F");
      doc.setFillColor(...C.amber900);  doc.rect(0, 25.1, W, 0.8, "F");
    }

    // ── Page 1 ───────────────────────────────────────────────
    drawPageHeader();

    // Title block (amber-50 bg)
    const TITLE_Y = 26;
    doc.setFillColor(...C.amber50);
    doc.rect(0, TITLE_Y, W, 15, "F");

    doc.setFontSize(13);
    doc.setTextColor(...C.slate900);
    doc.setFont("helvetica", "bold");
    doc.text(activite.nom, W / 2, TITLE_Y + 7, { align: "center", maxWidth: W - 50 });

    doc.setFontSize(7);
    doc.setTextColor(...C.slate500);
    doc.setFont("helvetica", "normal");
    doc.text("LISTE DES PARTICIPANTS", W / 2, TITLE_Y + 12.5, { align: "center" });

    // Info band
    const INFO_Y = 43;
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.25);
    doc.line(10, INFO_Y, W - 10, INFO_Y);

    const dateStr = `${format(new Date(activite.dateDebut), "d MMM", { locale: fr })} → ${format(new Date(activite.dateFin), "d MMM yyyy", { locale: fr })}`;
    const infoItems = [
      { label: "PÉRIODE",      value: dateStr },
      { label: "LIEU",         value: activite.lieu },
      { label: "MONTANT",      value: activite.montant === 0 ? "Gratuit" : formatMoney(activite.montant) },
      { label: "PARTICIPANTS", value: `${participants.length} participant${participants.length !== 1 ? "s" : ""}` },
    ];
    const colW = (W - 20) / 4;
    infoItems.forEach((item, i) => {
      const x = 10 + i * colW + 3;
      doc.setFontSize(6);
      doc.setTextColor(...C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, x, INFO_Y + 5.5);

      doc.setFontSize(8.5);
      doc.setTextColor(...C.slate900);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, x, INFO_Y + 11);
    });
    // Vertical dividers between info columns
    for (let i = 1; i < 4; i++) {
      doc.setDrawColor(...C.slate200);
      doc.line(10 + i * colW, INFO_Y + 1, 10 + i * colW, INFO_Y + 13);
    }
    doc.line(10, INFO_Y + 14, W - 10, INFO_Y + 14);

    // ── Table ────────────────────────────────────────────────
    const { header, rows } = buildParticipantExportTable(participants);
    const TABLE_START = INFO_Y + 16;
    const HEADER_H = 28; // header height to reserve on continuation pages

    autoTable(doc, {
      startY: TABLE_START,
      head: [header],
      body: rows,
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        lineColor: C.slate200,
        lineWidth: 0.2,
        textColor: C.slate900,
        font: "helvetica",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: C.amber900,
        textColor: C.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      alternateRowStyles: {
        fillColor: C.amber50,
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Matricule
        1: { cellWidth: 38 }, // Nom
        2: { cellWidth: 46 }, // Prénoms
        3: { cellWidth: 32 }, // Grade
        4: { cellWidth: 20 }, // Âge
        5: { cellWidth: 42 }, // Date paiement
      },
      margin: { left: 10, right: 10, top: HEADER_H, bottom: 12 },
      didDrawPage: (data) => {
        // Redraw header on continuation pages
        if (data.pageNumber > 1) drawPageHeader();
      },
    });

    // ── Footer on every page ─────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    const genDate = format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr });

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...C.slate200);
      doc.setLineWidth(0.25);
      doc.line(10, H - 8, W - 10, H - 8);

      doc.setFontSize(6.5);
      doc.setTextColor(...C.slate400);
      doc.setFont("helvetica", "normal");
      doc.text(`Généré le ${genDate}`, 10, H - 4.5);
      doc.text("CDLJ — Communauté Diocésaine des Lecteurs Juniors", W / 2, H - 4.5, { align: "center" });
      doc.text(`Page ${i} / ${totalPages}`, W - 10, H - 4.5, { align: "right" });
    }

    const base = safeExportFileName(activite.nom);
    triggerBrowserDownload(doc.output("blob"), `participants-${base}.pdf`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-red-100 shadow-xl text-red-800">
        {loadError}
      </div>
    );
  }

  if (!activite) return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
          {toast.message}
        </div>
      ) : null}

      <div className="min-h-screen pb-16">
        <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-amber-50/80 via-white/60 to-slate-50/40 border border-slate-200/60 shadow-sm">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/10 blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-amber-100/30 blur-[60px]" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition-all hover:bg-white hover:text-slate-800 group"
                onClick={() => router.push("/activites")}
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Retour à la liste
              </Button>

              {isManager && !activite.terminee ? (
                <Button
                  type="button"
                  className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                  onClick={() => setConfirmTermineeOpen(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme terminée
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-amber-700/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Fiche Activité</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {activite.nom}
                </h1>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${
                        activite.terminee
                          ? "bg-slate-50 text-slate-500 border-slate-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${activite.terminee ? "text-slate-500" : "text-green-700"}`} />
                      {activite.terminee ? "Terminée" : "En cours"}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                      {formatMoney(activite.montant)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-900/60" />
                    {format(new Date(activite.dateDebut), "PPP", { locale: fr })} — {format(new Date(activite.dateFin), "PPP", { locale: fr })}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-900/60" />
                    {activite.lieu}
                  </p>
                </div>
              </div>

              <div className="lg:w-[200px] lg:shrink-0">
                <div className="rounded-3xl border border-slate-200/60 bg-white p-3 shadow-sm">
                  {activite.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activite.image} alt="" className="w-full object-cover rounded-2xl max-h-40 mx-auto" />
                  ) : (
                    <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 flex items-center justify-center">
                      <Activity className="w-14 h-14 text-amber-900/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl w-fit max-w-full mb-8">
          <button
            type="button"
            onClick={() => setTab("infos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "infos" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Informations
          </button>
          <button
            type="button"
            onClick={() => setTab("participation")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === "participation" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Participation
          </button>
          {(isManager || isVicarial || isParoissial) && (
            <button
              type="button"
              onClick={() => setTab("paiements")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "paiements" ? "bg-white text-amber-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Banknote className="w-4 h-4" />
              Paiements
            </button>
          )}
        </div>

        {tab === "paiements" ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-900" />
              Paiements enregistrés pour cette activité
            </h2>
            {paiementsLoading ? (
              <div className="flex items-center gap-3 text-slate-600 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
                Chargement…
              </div>
            ) : paiements.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun paiement enregistré pour le moment.</p>
            ) : (
              <ul className="space-y-6">
                {paiements.map((p) => (
                  <li
                    key={p._id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          {p.createdAt ? format(new Date(p.createdAt), "PPPp", { locale: fr }) : "—"}
                        </p>
                        <p className="text-sm text-slate-700 mt-1">
                          {(isManager || isVicarial) && p.paroisseName ? (
                            <span className="font-semibold text-slate-900">Paroisse : {p.paroisseName}</span>
                          ) : null}
                          {p.userEmail ? (
                            <span className="block text-slate-600">
                              Compte : <span className="font-mono text-xs">{p.userEmail}</span>
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "pending"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Montant unitaire</span>
                        <p className="font-semibold text-slate-900">{formatMoney(p.montantUnitaire)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Lecteurs</span>
                        <p className="font-semibold text-slate-900">{p.nombreLecteurs}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total</span>
                        <p className="font-semibold text-amber-900">{formatMoney(p.montantTotal)}</p>
                      </div>
                    </div>
                    {p.fedapayReference ? (
                      <p className="text-xs text-slate-600">
                        Réf. FedaPay : <span className="font-mono">{p.fedapayReference}</span>
                      </p>
                    ) : null}
                    {p.lecteurs && p.lecteurs.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Lecteurs concernés
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.lecteurs.map((l) => (
                            <div
                              key={l._id}
                              className="inline-flex w-fit max-w-full min-w-0 items-center rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-white px-2.5 py-2 shadow-sm"
                              title={`${l.nom} ${l.prenoms}`}
                            >
                              <span className="text-xs font-bold leading-snug text-slate-900 break-words text-left">
                                {l.nom} {l.prenoms}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : tab === "infos" ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-5">Résumé de l’activité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Période</p>
                <p className="text-sm font-semibold text-slate-800">
                  {format(new Date(activite.dateDebut), "PPP", { locale: fr })} — {format(new Date(activite.dateFin), "PPP", { locale: fr })}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Lieu</p>
                <p className="text-sm font-semibold text-slate-800">{activite.lieu}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Montant</p>
                <p className="text-sm font-semibold text-slate-800">{formatMoney(activite.montant)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Délai de paiement</p>
                <p className="text-sm font-semibold text-slate-800">
                  {format(new Date(activite.delaiPaiement), "PPPp", { locale: fr })}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Numéro de paiement</p>
                <p className="text-sm font-semibold text-slate-800">{activite.numeroPaiement?.trim() || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(isManager || isVicarial) ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" /> Participation par paroisse
                </h2>
                {statsLoading ? (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                    Chargement des statistiques…
                  </div>
                ) : stats ? (
                  <>
                    <p className="text-sm text-slate-600 mb-3">
                      <span className="font-semibold text-amber-900">{stats.totalParticipants}</span> participant(s) sur{" "}
                      <span className="font-semibold">{stats.totalLecteurs}</span> lecteur(s) ({participationRate}%).
                    </p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="p-3 font-semibold text-slate-700">Paroisse</th>
                            {isManager ? <th className="p-3 font-semibold text-slate-700">Vicariat</th> : null}
                            <th className="p-3 font-semibold text-slate-700 text-right">Participants</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stats.byParoisse.length === 0 ? (
                            <tr>
                              <td colSpan={isManager ? 3 : 2} className="p-4 text-slate-500 text-center">
                                Aucune participation enregistrée
                              </td>
                            </tr>
                          ) : (
                            stats.byParoisse.map((row) => (
                              <tr key={row.paroisseId} className="hover:bg-amber-50/40">
                                <td className="p-3">{row.paroisseName}</td>
                                {isManager ? <td className="p-3 text-slate-600">{row.vicariatName ?? "—"}</td> : null}
                                <td className="p-3 text-right font-semibold text-amber-900">{row.count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Statistiques indisponibles.</p>
                )}
              </div>
            ) : null}

            {isParoissial ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Participants
                  </h2>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={downloadParticipantsExcel}
                      disabled={!participants.length || participantsLoading}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => void downloadParticipantsPdf()}
                      disabled={!participants.length || participantsLoading}
                    >
                      <FileText className="w-4 h-4 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
                {participantsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
                ) : participants.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune participation payée pour votre paroisse sur cette activité pour le moment.
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto space-y-2 text-sm">
                    {participants.map((p) => (
                      <li key={p.lecteur._id} className="flex justify-between gap-2 py-2 border-b border-slate-50">
                        <span className="font-medium text-slate-900">
                          {p.lecteur.nom} {p.lecteur.prenoms}
                        </span>
                        <span className="text-slate-500 shrink-0">{p.lecteur.uniqueId}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={confirmTermineeOpen} onOpenChange={setConfirmTermineeOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer cette activité comme terminée ?</DialogTitle>
            <DialogDescription>
              Une fois terminée, elle basculera dans la section des activités passées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" disabled={terminating} onClick={() => setConfirmTermineeOpen(false)}>
              Annuler
            </Button>
            <Button type="button" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white" disabled={terminating} onClick={() => void terminerActivite()}>
              {terminating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


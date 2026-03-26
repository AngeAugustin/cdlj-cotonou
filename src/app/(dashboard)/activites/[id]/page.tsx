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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type ParticipantRow = {
  paidAt: string;
  paroisseName?: string;
  vicariatName?: string;
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
  const includeParoisse = participants.some((p) => Boolean(p.paroisseName));
  const includeVicariat = participants.some((p) => Boolean(p.vicariatName));
  const header = [
    "Matricule",
    "Nom",
    "Prénoms",
    ...(includeParoisse ? ["Paroisse"] : []),
    ...(includeVicariat ? ["Vicariat"] : []),
    "Grade",
    "Âge",
    "Date de paiement",
  ];
  const rows = participants.map((p) => [
    p.lecteur.uniqueId,
    p.lecteur.nom,
    p.lecteur.prenoms,
    ...(includeParoisse ? [p.paroisseName || "—"] : []),
    ...(includeVicariat ? [p.vicariatName || "—"] : []),
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

const PARTICIPANT_FILTER_ALL = "__all__";

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

  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const [confirmTermineeOpen, setConfirmTermineeOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const [tab, setTab] = useState<"infos" | "participation" | "paiements">("infos");
  const [paiements, setPaiements] = useState<PaiementRow[]>([]);
  const [paiementsLoading, setPaiementsLoading] = useState(false);
  const [selectedPaiementId, setSelectedPaiementId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [meData, setMeData] = useState<{ paroisseName?: string; vicariatName?: string } | null>(null);
  const [selectedVicariat, setSelectedVicariat] = useState(PARTICIPANT_FILTER_ALL);
  const [selectedParoisse, setSelectedParoisse] = useState(PARTICIPANT_FILTER_ALL);

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

  const canSeeParticipants = isParoissial || isManager;

  const vicariatOptions = useMemo(
    () =>
      Array.from(new Set(participants.map((p) => p.vicariatName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [participants]
  );

  const paroisseOptions = useMemo(() => {
    const source =
      selectedVicariat === PARTICIPANT_FILTER_ALL
        ? participants
        : participants.filter((p) => p.vicariatName === selectedVicariat);
    return Array.from(new Set(source.map((p) => p.paroisseName).filter((v): v is string => Boolean(v)))).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
  }, [participants, selectedVicariat]);

  const filteredParticipants = useMemo(
    () =>
      participants.filter((p) => {
        if (selectedVicariat !== PARTICIPANT_FILTER_ALL && p.vicariatName !== selectedVicariat) return false;
        if (selectedParoisse !== PARTICIPANT_FILTER_ALL && p.paroisseName !== selectedParoisse) return false;
        return true;
      }),
    [participants, selectedVicariat, selectedParoisse]
  );

  /** Liste des participants payés : paroisse courante pour PAROISSIAL, activité entière pour manager. */
  useEffect(() => {
    if (!activite || !canSeeParticipants) return;
    setParticipantsLoading(true);
    void fetch(`/api/activites/${encodeURIComponent(activite._id)}/participations`)
      .then((r) => r.json().catch(() => ([])))
      .then((data) => setParticipants(Array.isArray(data) ? (data as ParticipantRow[]) : []))
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  }, [activite, canSeeParticipants]);

  useEffect(() => {
    if (selectedVicariat === PARTICIPANT_FILTER_ALL) return;
    if (!vicariatOptions.includes(selectedVicariat)) {
      setSelectedVicariat(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedVicariat, vicariatOptions]);

  useEffect(() => {
    if (selectedParoisse === PARTICIPANT_FILTER_ALL) return;
    if (!paroisseOptions.includes(selectedParoisse)) {
      setSelectedParoisse(PARTICIPANT_FILTER_ALL);
    }
  }, [selectedParoisse, paroisseOptions]);

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

  useEffect(() => {
    if (!selectedPaiementId) return;
    const stillSelectable = paiements.some((p) => p._id === selectedPaiementId && p.status === "approved");
    if (!stillSelectable) {
      setSelectedPaiementId(null);
    }
  }, [paiements, selectedPaiementId]);

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
    if (!activite || !filteredParticipants.length) return;
    const { header, rows } = buildParticipantExportTable(filteredParticipants);
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
    if (!activite || !filteredParticipants.length) return;

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
    const { header, rows } = buildParticipantExportTable(filteredParticipants);
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
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-900" />
                Paiements enregistrés
              </h2>
              {paiements.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {paiements.length} transaction{paiements.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {paiementsLoading ? (
              <div className="bg-white rounded-3xl border border-slate-100 flex items-center justify-center gap-3 py-12 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-amber-900" />
                Chargement…
              </div>
            ) : paiements.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-12 text-center">
                <p className="text-sm text-slate-500">Aucun paiement enregistré pour le moment.</p>
              </div>
            ) : (
              <div className="flex gap-6 items-start">
                {/* ── Tickets list — 60% ─────────────────────────── */}
                <ul className="space-y-5 flex-[6]">
                {paiements.map((p) => {
                  const isSelectable = p.status === "approved";
                  const s =
                    p.status === "approved"
                      ? { bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Approuvé" }
                      : p.status === "pending"
                        ? { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-400 animate-pulse", label: "En attente" }
                        : p.status === "non_finalized"
                          ? { bar: "bg-red-300", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", label: "Non finalisé" }
                        : { bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: p.status };

                  const isSelected = isSelectable && selectedPaiementId === p._id;
                  return (
                    <li key={p._id}>
                      {/* ── Ticket card ─────────────────────────────────── */}
                      <div
                        onClick={isSelectable ? () => setSelectedPaiementId(isSelected ? null : p._id) : undefined}
                        className={`relative flex rounded-2xl border shadow-md overflow-visible transition-all duration-200 ${
                          isSelected
                            ? "border-amber-300 shadow-amber-200/60 ring-2 ring-amber-200 bg-white"
                            : isSelectable
                              ? "border-slate-100 shadow-slate-200/40 bg-white hover:border-slate-200 cursor-pointer"
                              : "border-slate-100 shadow-slate-200/40 bg-white cursor-default"
                        }`}
                      >

                        {/* Status accent bar — left edge */}
                        <div className={`w-1 rounded-l-2xl shrink-0 ${s.bar}`} />

                        <div className="flex flex-1 min-w-0 overflow-hidden rounded-r-2xl">

                          {/* ── Main body ──────────────────────────────────── */}
                          <div className="flex-1 min-w-0 px-5 py-4 space-y-3">

                            {/* Row 1: badge + date */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold leading-none border ${s.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {s.label}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                {p.createdAt ? format(new Date(p.createdAt), "d MMM yyyy · HH:mm", { locale: fr }) : "—"}
                              </span>
                            </div>

                            {/* Row 2: paroisse / email (managers uniquement) */}
                            {(isManager || isVicarial) && (p.paroisseName || p.userEmail) && (
                              <p className="text-[13px] font-bold text-slate-900 truncate">
                                {p.paroisseName ?? p.userEmail}
                              </p>
                            )}

                            {/* Row 3: formule montant */}
                            <div className="flex flex-wrap items-stretch gap-2">
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Unitaire</p>
                                <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">{formatMoney(p.montantUnitaire)}</p>
                              </div>
                              <div className="flex items-center text-slate-300 font-light text-base select-none px-0.5">×</div>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Lecteurs</p>
                                <p className="text-xs font-semibold text-slate-700">{p.nombreLecteurs}</p>
                              </div>
                              <div className="flex items-center text-slate-300 font-light text-base select-none px-0.5">=</div>
                              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">Total</p>
                                <p className="text-sm font-extrabold text-amber-900 whitespace-nowrap">{formatMoney(p.montantTotal)}</p>
                              </div>
                            </div>
                          </div>

                          {/* ── Ticket perforation ─────────────────────────── */}
                          <div className="relative flex flex-col items-center self-stretch w-7 shrink-0">
                            {/* Top notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-slate-100 border border-slate-200 z-10" />
                            {/* Dashed line */}
                            <div className="flex-1 w-0 border-l-2 border-dashed border-slate-200 my-1" />
                            {/* Bottom notch */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[14px] h-[14px] rounded-full bg-slate-100 border border-slate-200 z-10" />
                          </div>

                          {/* ── Stub — référence + lecteurs ────────────────── */}
                          <div className="w-52 shrink-0 bg-slate-50/80 px-4 py-4 flex flex-col gap-3 justify-center">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Réf. FedaPay</p>
                              {p.fedapayReference ? (
                                <p className="font-mono text-[11px] text-slate-700 font-semibold break-all leading-snug">{p.fedapayReference}</p>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">Aucune référence</p>
                              )}
                            </div>
                            {p.lecteurs && p.lecteurs.length > 0 && (
                              <div>
                                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                  Lecteurs
                                </p>
                                <p className="text-xl font-extrabold text-slate-800">{p.lecteurs.length}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                </ul>

                {/* ── Lecteurs panel — 40% ───────────────────────── */}
                {(() => {
                  // Aggregate unique lecteurs across approved paiements only
                  const approvedPaiements = paiements.filter((p) => p.status === "approved");
                  const seen = new Set<string>();
                  const allLecteurs: { _id: string; nom: string; prenoms: string; paroisseName?: string; paiementId: string }[] = [];
                  approvedPaiements.forEach((p) => {
                    (p.lecteurs ?? []).forEach((l: { _id: string; nom: string; prenoms: string }) => {
                      if (!seen.has(l._id)) {
                        seen.add(l._id);
                        allLecteurs.push({ ...l, paroisseName: p.paroisseName, paiementId: p._id });
                      }
                    });
                  });

                  // Sort: selected paiement's lecteurs first, rest after
                  const sortedLecteurs = selectedPaiementId
                    ? [
                        ...allLecteurs.filter((l) => l.paiementId === selectedPaiementId),
                        ...allLecteurs.filter((l) => l.paiementId !== selectedPaiementId),
                      ]
                    : allLecteurs;

                  const selectedCount = selectedPaiementId
                    ? allLecteurs.filter((l) => l.paiementId === selectedPaiementId).length
                    : null;

                  return (
                    <div className="flex-[4] bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/30 overflow-hidden sticky top-4">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            Lecteurs inscrits
                          </p>
                          {selectedPaiementId && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                              {selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""} · cliquez pour désélectionner
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-900 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5 leading-none">
                          {allLecteurs.length}
                        </span>
                      </div>
                      {/* List */}
                      <ul className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
                        {sortedLecteurs.length === 0 ? (
                          <li className="px-5 py-6 text-center text-sm text-slate-400">Aucun lecteur trouvé.</li>
                        ) : (
                          sortedLecteurs.map((l, i) => {
                            const highlighted = selectedPaiementId && l.paiementId === selectedPaiementId;
                            return (
                              <li
                                key={l._id}
                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                  highlighted
                                    ? "bg-amber-50/70 border-l-2 border-amber-300"
                                    : "hover:bg-slate-50/60"
                                }`}
                              >
                                {/* Index bubble */}
                                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold leading-none ${
                                  highlighted
                                    ? "bg-amber-200 border border-amber-300 text-amber-900"
                                    : "bg-amber-50 border border-amber-100 text-amber-700"
                                }`}>
                                  {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[12px] font-semibold truncate leading-tight ${highlighted ? "text-amber-900" : "text-slate-800"}`}>
                                    {l.nom} {l.prenoms}
                                  </p>
                                  {(isManager || isVicarial) && l.paroisseName && (
                                    <p className="text-[10px] text-slate-400 truncate leading-tight">{l.paroisseName}</p>
                                  )}
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  );
                })()}
              </div>
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
            {canSeeParticipants ? (
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
                      disabled={!filteredParticipants.length || participantsLoading}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => void downloadParticipantsPdf()}
                      disabled={!filteredParticipants.length || participantsLoading}
                    >
                      <FileText className="w-4 h-4 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
                {isManager && participants.length > 0 ? (
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Vicariat</p>
                      <Select
                        value={selectedVicariat}
                        onValueChange={(value) => {
                          setSelectedVicariat(value ?? PARTICIPANT_FILTER_ALL);
                          setSelectedParoisse(PARTICIPANT_FILTER_ALL);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>{selectedVicariat === PARTICIPANT_FILTER_ALL ? "Tous les vicariats" : selectedVicariat}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Tous les vicariats</SelectItem>
                          {vicariatOptions.map((vicariat) => (
                            <SelectItem key={vicariat} value={vicariat}>
                              {vicariat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Paroisse</p>
                      <Select value={selectedParoisse} onValueChange={(value) => setSelectedParoisse(value ?? PARTICIPANT_FILTER_ALL)}>
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 justify-between">
                          <SelectValue>{selectedParoisse === PARTICIPANT_FILTER_ALL ? "Toutes les paroisses" : selectedParoisse}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PARTICIPANT_FILTER_ALL}>Toutes les paroisses</SelectItem>
                          {paroisseOptions.map((paroisse) => (
                            <SelectItem key={paroisse} value={paroisse}>
                              {paroisse}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
                {participantsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
                ) : participants.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {isManager
                      ? "Aucune participation payée sur cette activité pour le moment."
                      : "Aucune participation payée pour votre paroisse sur cette activité pour le moment."}
                  </p>
                ) : filteredParticipants.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun participant ne correspond aux filtres sélectionnés.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto space-y-2 text-sm">
                    {filteredParticipants.map((p) => (
                      <li key={p.lecteur._id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {p.lecteur.nom} {p.lecteur.prenoms}
                          </p>
                          {isManager && (p.paroisseName || p.vicariatName) ? (
                            <p className="text-xs text-slate-500">
                              {p.paroisseName ?? "—"}
                              {p.vicariatName ? ` • ${p.vicariatName}` : ""}
                            </p>
                          ) : null}
                        </div>
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


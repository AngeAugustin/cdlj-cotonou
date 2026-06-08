"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Banknote,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardPageShell, DashboardPanel } from "@/components/dashboard/page-shell";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePaginatedList } from "@/lib/pagination";

// ── Types ─────────────────────────────────────────────────
type Activite = {
  _id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  montant: number;
  delaiPaiement: string;
  grillePenalite?: {
    dateDebut: string;
    dateFin: string;
    montantSupplementaire: number;
  }[];
  image?: string;
  terminee: boolean;
};

type Toast = { message: string; type: "success" | "error" };

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " FCFA";
}

// ── Page ──────────────────────────────────────────────────
export default function ActivitesPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const sessionUser = session?.user as { roles?: string[] } | undefined;
  const roles: string[] = sessionUser?.roles ?? [];
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

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [termineeTarget, setTermineeTarget] = useState<Activite | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

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

  useEffect(() => {
    const message = searchParams.get("toast");
    const type = searchParams.get("type") === "error" ? "error" : "success";
    if (message) {
      showToast(message, type);
      window.history.replaceState(null, "", "/activites");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const deleteTarget = useMemo(
    () => (deleteId ? activites.find((a) => a._id === deleteId) ?? null : null),
    [activites, deleteId]
  );

  const canConfirmDelete =
    !!deleteTarget && deleteConfirmName.trim() === deleteTarget.nom.trim();

  const closeDeleteDialog = () => {
    setDeleteId(null);
    setDeleteConfirmName("");
  };

  const filtered = useMemo(() => {
    return activites.filter((a) => (mainTab === "encours" ? !a.terminee : a.terminee));
  }, [activites, mainTab]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    totalItems,
    showPagination,
    goToPreviousPage,
    goToNextPage,
  } = usePaginatedList(filtered, mainTab);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activites/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Activité supprimée");
        closeDeleteDialog();
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

  const ActivityCard = ({ a }: { a: Activite }) => {
    const dateDebut = format(new Date(a.dateDebut), "d MMM yyyy", { locale: fr });
    const dateFin = format(new Date(a.dateFin), "d MMM yyyy", { locale: fr });
    const delaiPaiement = a.delaiPaiement
      ? format(new Date(a.delaiPaiement), "d MMM yyyy · HH:mm", { locale: fr })
      : null;

    return (
      <article className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-amber-100 hover:shadow-md hover:shadow-amber-900/5">
        <div className="flex flex-col lg:flex-row lg:items-center">
          <div className="relative h-24 w-full shrink-0 overflow-hidden bg-slate-100 lg:h-24 lg:w-36 xl:w-40">
            {a.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/80">
                <Activity className="h-7 w-7 text-amber-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-white/10" />
            <span
              className={cn(
                "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                a.terminee ? "bg-white/90 text-slate-600" : "bg-white/95 text-amber-900 shadow-sm"
              )}
            >
              {!a.terminee && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {a.terminee ? "Terminée" : "En cours"}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3 sm:p-3.5 lg:flex-row lg:items-center lg:gap-4 xl:gap-5">
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-bold leading-snug text-slate-900 sm:text-base">{a.nom}</h4>
                {delaiPaiement && !a.terminee ? (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Délai de paiement : <span className="font-medium text-slate-700">{delaiPaiement}</span>
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Période</p>
                    <p className="text-xs font-medium text-slate-800">
                      {dateDebut}
                      <span className="mx-1 text-slate-300">→</span>
                      {dateFin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lieu</p>
                    <p className="truncate text-xs font-medium text-slate-800">{a.lieu || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <Banknote className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tarif</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {a.montant === 0 ? "Gratuit" : formatMoney(a.montant)}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 lg:w-auto lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-3.5 lg:pt-0 xl:min-w-[8.75rem]">
              <Link
                href={`/activites/${a._id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 justify-center rounded-lg border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50"
                )}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Détails
              </Link>

              {isVicarial && !a.terminee ? (
                <Link
                  href={`/activites/${a._id}/participer`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "h-8 justify-center rounded-lg bg-amber-900 px-3 font-semibold text-white hover:bg-amber-800"
                  )}
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Participer
                </Link>
              ) : null}

              {isManager ? (
                <div className="flex w-full flex-wrap items-center gap-1.5 lg:justify-stretch">
                  {!a.terminee ? (
                    <Link
                      href={`/activites/${a._id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 flex-1 justify-center rounded-lg lg:flex-none"
                      )}
                      title="Modifier"
                      aria-label="Modifier l’activité"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="ml-1.5 lg:hidden xl:inline">Modifier</span>
                    </Link>
                  ) : null}
                  {!a.terminee ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 flex-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 lg:flex-none"
                      title="Marquer comme terminée"
                      aria-label="Marquer comme terminée"
                      onClick={() => setTermineeTarget(a)}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="ml-1.5 lg:hidden xl:inline">Terminer</span>
                    </Button>
                  ) : null}
                  {isSuperAdmin ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-lg border-red-200 text-red-600 hover:bg-red-50 lg:flex-none"
                      title="Supprimer"
                      aria-label="Supprimer l’activité"
                      onClick={() => {
                        setDeleteConfirmName("");
                        setDeleteId(a._id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <DashboardPageShell
      title="Activités"
      description={
        isManager
          ? "Créez et pilotez les activités diocésaines."
          : isVicarial
            ? "Suivez les activités et inscrivez les lecteurs des paroisses de votre vicariat."
            : "Consultez les activités et suivez la participation de vos lecteurs."
      }
      actions={
        isManager ? (
          <>
            <Link
              href="/activites/new"
              title="Ajouter une activité"
              aria-label="Ajouter une activité"
              className={cn(
                buttonVariants({ size: "icon" }),
                "h-11 w-11 shrink-0 rounded-xl bg-amber-900 text-white shadow-xl shadow-amber-900/20 hover:bg-amber-800 lg:hidden"
              )}
            >
              <Plus className="w-5 h-5" />
            </Link>
            <Link
              href="/activites/new"
              className={cn(
                buttonVariants(),
                "hidden h-12 shrink-0 rounded-2xl bg-amber-900 px-8 font-bold text-white shadow-xl shadow-amber-900/20 hover:bg-amber-800 lg:inline-flex"
              )}
            >
              <Plus className="mr-2 h-5 w-5" /> Créer une activité
            </Link>
          </>
        ) : null
      }
    >
      {toast && (
        <div
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-medium ${
            toast.type === "success" ? "bg-emerald-700" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

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
        <div className="space-y-4">
          {paginatedItems.map((a) => (
            <ActivityCard key={a._id} a={a} />
          ))}
          {showPagination ? (
            <DashboardPanel className="px-4 py-3 sm:px-5">
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageStart={pageStart}
                pageEnd={pageEnd}
                totalItems={totalItems}
                show={showPagination}
                itemLabel="activité"
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </DashboardPanel>
          ) : null}
        </div>
      )}

      {/* ── Suppression ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && closeDeleteDialog()}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Supprimer cette activité ?</DialogTitle>
            <DialogDescription>
              Les participations associées seront également supprimées. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Pour confirmer, saisissez le nom exact de l&apos;activité :{" "}
                <span className="font-bold text-slate-900">{deleteTarget.nom}</span>
              </p>
              <div>
                <Label htmlFor="delete-confirm-nom" className="sr-only">
                  Nom de l&apos;activité à confirmer
                </Label>
                <Input
                  id="delete-confirm-nom"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deleteTarget.nom}
                  className="rounded-xl"
                  autoComplete="off"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeDeleteDialog} disabled={deleting}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleting || !canConfirmDelete}
              onClick={confirmDelete}
            >
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
    </DashboardPageShell>
  );
}

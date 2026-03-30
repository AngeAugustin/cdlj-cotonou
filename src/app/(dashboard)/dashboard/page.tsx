import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Users,
  Activity,
  Building2,
  GraduationCap,
  Award,
  ChevronRight,
  Calendar,
  FileText,
  MapPin,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { dashboardPrimaryRole, getDashboardData } from "@/lib/dashboardData";
import { DashboardPageShell, DashboardPanel } from "@/components/dashboard/page-shell";

function formatInt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as {
    roles?: string[];
    parishId?: string | null;
    vicariatId?: string | null;
  } | undefined;

  const roles = user?.roles ?? [];
  const role = dashboardPrimaryRole(roles);
  const data = await getDashboardData(user);

  const showParoissesCard = data.isManager || data.isVicarial;
  const showEvaluationsKpi = data.isManager;
  const showAssembleesKpi = data.isVicarial && !data.isManager;

  return (
    <DashboardPageShell
      title={`Vue globale ${role.toLowerCase()}`}
      description="Suivez l'activité et l'évolution de votre juridiction en un coup d'œil."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20 flex items-center gap-3 group hover:-translate-y-0.5 transition-all min-h-0">
          <div className="w-10 h-10 shrink-0 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900 group-hover:scale-105 group-hover:bg-amber-900 group-hover:text-white transition-all">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-slate-500 text-xs font-medium leading-tight">Total lecteurs</h3>
            <p className="text-xl font-black text-slate-900 leading-tight tabular-nums">{formatInt(data.totalLecteurs)}</p>
          </div>
        </div>

        {showParoissesCard && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20 flex items-center gap-3 group hover:-translate-y-0.5 transition-all min-h-0">
            <div className="w-10 h-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-500 text-xs font-medium leading-tight">Paroisses</h3>
              <p className="text-xl font-black text-slate-900 leading-tight tabular-nums">
                {data.totalParoisses != null ? formatInt(data.totalParoisses) : "—"}
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 rounded-2xl border border-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-3 group hover:-translate-y-0.5 transition-all min-h-0">
          <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-105 transition-all">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-slate-400 text-xs font-medium leading-tight">Activités en cours</h3>
              {data.activitesEnCours > 0 ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20 leading-none">
                  En cours
                </span>
              ) : null}
            </div>
            <p className="text-xl font-black text-white leading-tight tabular-nums">{formatInt(data.activitesEnCours)}</p>
          </div>
        </div>

        {showEvaluationsKpi && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20 flex items-center gap-3 group hover:-translate-y-0.5 transition-all min-h-0">
            <div className="w-10 h-10 shrink-0 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-500 text-xs font-medium leading-tight">Évaluations en cours</h3>
              <p className="text-xl font-black text-slate-900 leading-tight tabular-nums">{formatInt(data.evaluationsEnCours)}</p>
            </div>
          </div>
        )}

        {showAssembleesKpi && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/20 flex items-center gap-3 group hover:-translate-y-0.5 transition-all min-h-0">
            <div className="w-10 h-10 shrink-0 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-500 text-xs font-medium leading-tight">Assemblées en cours</h3>
              <p className="text-xl font-black text-slate-900 leading-tight tabular-nums">{formatInt(data.assembleesEnCours)}</p>
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Activités récentes</h2>
            <Link
              href="/activites"
              className="text-sm font-semibold text-amber-900 hover:text-amber-700 flex items-center gap-1"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <DashboardPanel className="shadow-lg overflow-hidden">
            {data.recentActivites.length === 0 ? (
              <p className="p-8 text-sm text-slate-500 text-center">Aucune activité enregistrée pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.recentActivites.map((item) => (
                  <Link
                    key={item._id}
                    href={`/activites/${item._id}`}
                    className="px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden relative bg-slate-100 mt-0.5">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
                          <Activity className="w-5 h-5 text-amber-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-[13px] font-semibold text-slate-900 leading-snug truncate">
                          {item.nom}
                        </h4>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none ${
                            item.terminee
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-50 text-amber-800 border border-amber-100"
                          }`}
                        >
                          {!item.terminee && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          {item.terminee ? "Terminée" : "En cours"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {format(new Date(item.dateDebut), "d MMM", { locale: fr })}
                          {" → "}
                          {format(new Date(item.dateFin), "d MMM yyyy", { locale: fr })}
                        </span>
                        {item.lieu && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {item.lieu}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Banknote className="w-3 h-3 shrink-0" />
                          {item.montant === 0
                            ? "Gratuit"
                            : `${formatInt(item.montant)} FCFA`}
                        </span>
                        {item.participantsScope && (
                          <span className="text-slate-400">
                            {formatInt(item.participants)} participant{item.participants !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">À suivre</h2>

          {data.isManager && data.highlightEvaluation ? (
            <div className="bg-amber-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-amber-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
              <Award className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Évaluation en cours</h3>
              <p className="text-amber-100/90 mb-2 leading-relaxed font-semibold">{data.highlightEvaluation.nom}</p>
              <p className="text-amber-100/80 text-sm mb-8">
                Année {data.highlightEvaluation.annee} — {data.highlightEvaluation.gradeLabel}
              </p>
              <Link
                href={`/evaluations/${data.highlightEvaluation._id}`}
                className="block w-full text-center bg-white text-amber-950 font-bold py-3.5 px-6 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
              >
                Consulter
              </Link>
            </div>
          ) : null}

          {data.isManager && !data.highlightEvaluation ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">Évaluations</p>
              <p>Aucune évaluation en cours. Les campagnes actives apparaîtront ici.</p>
              <Link
                href="/evaluations"
                className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-amber-900 hover:text-amber-700"
              >
                Gérer les évaluations <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null}

          {data.isVicarial && !data.isManager ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileText className="w-8 h-8 text-amber-800 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Assemblées générales</h3>
              <p className="text-sm text-slate-600 mb-4">
                {data.assembleesEnCours > 0
                  ? `${formatInt(data.assembleesEnCours)} assemblée(s) en cours — déposez ou mettez à jour vos rapports.`
                  : "Aucune assemblée en cours pour le moment."}
              </p>
              <Link
                href="/assemblees"
                className="inline-flex items-center gap-1 text-sm font-bold text-amber-900 hover:text-amber-700"
              >
                Voir les assemblées <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null}

          {data.isParoissial && !data.isManager && !data.isVicarial ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Activity className="w-8 h-8 text-amber-800 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Activités diocésaines</h3>
              <p className="text-sm text-slate-600 mb-4">
                Inscrivez vos lecteurs aux activités en cours et consultez les participations de votre paroisse.
              </p>
              <Link
                href="/activites"
                className="inline-flex items-center gap-1 text-sm font-bold text-amber-900 hover:text-amber-700"
              >
                Voir les activités <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardPageShell>
  );
}

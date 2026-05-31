import { LecteurService } from "@/modules/lecteurs/service";
import { ParoisseService } from "@/modules/paroisses/service";
import { ActiviteService } from "@/modules/activites/service";
import { EvaluationService } from "@/modules/evaluations/service";
import { AssembleeGeneraleService } from "@/modules/assemblees/service";

export type DashboardSessionUser = {
  roles?: string[];
  parishId?: string | null;
  vicariatId?: string | null;
};

export type DashboardRecentActivite = {
  _id: string;
  nom: string;
  lieu: string;
  image?: string;
  terminee: boolean;
  dateDebut: Date | string;
  dateFin: Date | string;
  montant: number;
  participants: number;
  participantsScope: "diocèse" | "vicariat" | "paroisse" | "";
};

export type DashboardHighlightEvaluation = {
  _id: string;
  nom: string;
  annee: number;
  gradeLabel: string;
};

export type DashboardData = {
  totalLecteurs: number;
  totalParoisses: number | null;
  activitesEnCours: number;
  recentActivites: DashboardRecentActivite[];
  evaluationsEnCours: number;
  highlightEvaluation: DashboardHighlightEvaluation | null;
  assembleesEnCours: number;
  isManager: boolean;
  isVicarial: boolean;
  isParoissial: boolean;
  canViewAssemblees: boolean;
};

function primaryRole(roles: string[]): string {
  const order = ["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"];
  for (const r of order) {
    if (roles.includes(r)) return r;
  }
  return roles[0] ?? "UTILISATEUR";
}

export function dashboardPrimaryRole(roles: string[] | undefined): string {
  return primaryRole(roles ?? []);
}

async function countLecteursForUser(
  lecteurService: LecteurService,
  user: DashboardSessionUser | undefined,
  isSuper: boolean,
  isDioc: boolean,
  isVicarial: boolean,
  isParoissial: boolean
): Promise<number> {
  try {
    if (isSuper || isDioc) return await lecteurService.countLecteurs();
    if (isVicarial && user?.vicariatId) return await lecteurService.countLecteursByVicariat(user.vicariatId);
    if (isParoissial && user?.parishId) return await lecteurService.countLecteursByParish(user.parishId);
  } catch {
    return 0;
  }
  return 0;
}

async function countParoissesForUser(
  paroisseService: ParoisseService,
  user: DashboardSessionUser | undefined,
  isManager: boolean,
  isVicarial: boolean
): Promise<number | null> {
  try {
    if (isVicarial && user?.vicariatId) return await paroisseService.countParoisses({ vicariatId: user.vicariatId });
    if (isManager) return await paroisseService.countParoisses();
  } catch {
    return isManager || isVicarial ? 0 : null;
  }
  return null;
}

async function countParticipantsForActivite(
  activiteService: ActiviteService,
  activiteId: string,
  user: DashboardSessionUser | undefined,
  isManager: boolean,
  isVicarial: boolean,
  isParoissial: boolean
): Promise<{ participants: number; participantsScope: DashboardRecentActivite["participantsScope"] }> {
  try {
    if (isManager) {
      const participants = await activiteService.countParticipantsForActivite(activiteId);
      return { participants, participantsScope: "diocèse" };
    }
    if (isVicarial && user?.vicariatId) {
      const participants = await activiteService.countParticipantsForActivite(activiteId, user.vicariatId);
      return { participants, participantsScope: "vicariat" };
    }
    if (isParoissial && user?.parishId) {
      const participants = await activiteService.countParticipantsForParoisse(activiteId, user.parishId);
      return { participants, participantsScope: "paroisse" };
    }
  } catch {
    return { participants: 0, participantsScope: "" };
  }
  return { participants: 0, participantsScope: "" };
}

export async function getDashboardData(user: DashboardSessionUser | undefined): Promise<DashboardData> {
  const roles = user?.roles ?? [];
  const isSuper = roles.includes("SUPERADMIN");
  const isDioc = roles.includes("DIOCESAIN");
  const isManager = isSuper || isDioc;
  const isVicarial = roles.includes("VICARIAL");
  const isParoissial = roles.includes("PAROISSIAL");
  const canViewAssemblees = isManager || isVicarial;

  const lecteurService = new LecteurService();
  const paroisseService = new ParoisseService();
  const activiteService = new ActiviteService();
  const evaluationService = new EvaluationService();
  const assembleeService = new AssembleeGeneraleService();

  const [
    totalLecteurs,
    totalParoisses,
    activitesEnCours,
    recentSlice,
    evaluationSummary,
    assembleesEnCours,
  ] = await Promise.all([
    countLecteursForUser(lecteurService, user, isSuper, isDioc, isVicarial, isParoissial),
    countParoissesForUser(paroisseService, user, isManager, isVicarial),
    activiteService.countOpenActivites().catch(() => 0),
    activiteService.findRecentActivites(5).catch(() => [] as Array<{
      _id: unknown;
      nom: string;
      lieu: string;
      image?: string;
      terminee?: boolean;
      dateDebut: Date;
      dateFin: Date;
      montant: number;
    }>),
    isManager
      ? Promise.all([
          evaluationService.countOpenEvaluations().catch(() => 0),
          evaluationService.findFirstOpenEvaluation().catch(() => null),
        ]).then(([count, first]) => ({
          evaluationsEnCours: count,
          highlightEvaluation:
            first && first._id
              ? {
                  _id: String(first._id),
                  nom: first.nom,
                  annee: first.annee,
                  gradeLabel:
                    (first.gradeId as { name?: string; abbreviation?: string } | undefined)?.name ??
                    (first.gradeId as { name?: string; abbreviation?: string } | undefined)?.abbreviation ??
                    "Grade",
                }
              : null,
        }))
      : Promise.resolve({ evaluationsEnCours: 0, highlightEvaluation: null }),
    canViewAssemblees ? assembleeService.countOpenAssemblees().catch(() => 0) : Promise.resolve(0),
  ]);

  const recentActivites: DashboardRecentActivite[] = await Promise.all(
    recentSlice.map(async (a) => {
      const id = String(a._id);
      const { participants, participantsScope } = await countParticipantsForActivite(
        activiteService,
        id,
        user,
        isManager,
        isVicarial,
        isParoissial
      );

      return {
        _id: id,
        nom: a.nom,
        lieu: a.lieu,
        image: a.image,
        terminee: !!a.terminee,
        dateDebut: a.dateDebut,
        dateFin: a.dateFin,
        montant: a.montant,
        participants,
        participantsScope,
      };
    })
  );

  return {
    totalLecteurs,
    totalParoisses,
    activitesEnCours,
    recentActivites,
    evaluationsEnCours: evaluationSummary.evaluationsEnCours,
    highlightEvaluation: evaluationSummary.highlightEvaluation,
    assembleesEnCours,
    isManager,
    isVicarial,
    isParoissial,
    canViewAssemblees,
  };
}

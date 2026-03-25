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

  let totalLecteurs = 0;
  try {
    if (isSuper || isDioc) {
      const list = await lecteurService.getLecteurs();
      totalLecteurs = Array.isArray(list) ? list.length : 0;
    } else if (isVicarial && user?.vicariatId) {
      const list = await lecteurService.getLecteursByVicariat(user.vicariatId);
      totalLecteurs = Array.isArray(list) ? list.length : 0;
    } else if (isParoissial && user?.parishId) {
      const list = await lecteurService.getLecteursByParish(user.parishId);
      totalLecteurs = Array.isArray(list) ? list.length : 0;
    }
  } catch {
    totalLecteurs = 0;
  }

  let totalParoisses: number | null = null;
  try {
    if (isVicarial && user?.vicariatId) {
      const p = await paroisseService.getParoisses({ vicariatId: user.vicariatId });
      totalParoisses = Array.isArray(p) ? p.length : 0;
    } else if (isManager) {
      const p = await paroisseService.getParoisses();
      totalParoisses = Array.isArray(p) ? p.length : 0;
    }
  } catch {
    totalParoisses = isManager || isVicarial ? 0 : null;
  }

  let activitesList: Array<{
    _id: unknown;
    nom: string;
    lieu: string;
    image?: string;
    terminee?: boolean;
    dateDebut: Date;
    dateFin: Date;
    montant: number;
  }> = [];

  try {
    const raw = await activiteService.getActivites();
    activitesList = Array.isArray(raw) ? (raw as typeof activitesList) : [];
  } catch {
    activitesList = [];
  }

  const activitesEnCours = activitesList.filter((a) => !a.terminee).length;

  const recentSorted = [...activitesList].sort(
    (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
  );
  const recentSlice = recentSorted.slice(0, 5);

  const recentActivites: DashboardRecentActivite[] = await Promise.all(
    recentSlice.map(async (a) => {
      const id = String(a._id);
      let participants = 0;
      let participantsScope: DashboardRecentActivite["participantsScope"] = "";
      try {
        if (isManager) {
          const s = await activiteService.getStats(id, null);
          participants = s.totalParticipants;
          participantsScope = "diocèse";
        } else if (isVicarial && user?.vicariatId) {
          const s = await activiteService.getStats(id, user.vicariatId);
          participants = s.totalParticipants;
          participantsScope = "vicariat";
        } else if (isParoissial && user?.parishId) {
          participants = await activiteService.countParticipantsForParoisse(id, user.parishId);
          participantsScope = "paroisse";
        }
      } catch {
        participants = 0;
        participantsScope = "";
      }
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

  let evaluationsEnCours = 0;
  let highlightEvaluation: DashboardHighlightEvaluation | null = null;
  if (isManager) {
    try {
      const evs = await evaluationService.getEvaluations();
      type EvRow = {
        _id: unknown;
        nom: string;
        annee: number;
        terminee?: boolean;
        gradeId?: { name?: string; abbreviation?: string };
      };
      const arr: EvRow[] = Array.isArray(evs) ? (evs as EvRow[]) : [];
      const open = arr.filter((e) => !e.terminee);
      evaluationsEnCours = open.length;
      const first = open[0];
      if (first) {
        highlightEvaluation = {
          _id: String(first._id),
          nom: first.nom,
          annee: first.annee,
          gradeLabel: first.gradeId?.name ?? first.gradeId?.abbreviation ?? "Grade",
        };
      }
    } catch {
      evaluationsEnCours = 0;
      highlightEvaluation = null;
    }
  }

  let assembleesEnCours = 0;
  if (canViewAssemblees) {
    try {
      const ass = await assembleeService.getAssemblees();
      const arr = Array.isArray(ass) ? ass : [];
      assembleesEnCours = arr.filter((x: { terminee?: boolean }) => !x.terminee).length;
    } catch {
      assembleesEnCours = 0;
    }
  }

  return {
    totalLecteurs,
    totalParoisses,
    activitesEnCours,
    recentActivites,
    evaluationsEnCours,
    highlightEvaluation,
    assembleesEnCours,
    isManager,
    isVicarial,
    isParoissial,
    canViewAssemblees,
  };
}

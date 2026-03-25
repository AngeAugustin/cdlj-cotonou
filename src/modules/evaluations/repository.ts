import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { Evaluation, EvaluationLecteur, EvaluationNote, type IEvaluation } from "./model";
import { CreateEvaluationInput, UpdateEvaluationInput, UpsertEvaluationNoteInput } from "./schema";
import { Lecteur } from "@/modules/lecteurs/model";
import { Grade } from "@/modules/grades/model";

type EvaluationFullRow = IEvaluation & {
  gradeId?: { _id: mongoose.Types.ObjectId; name: string; abbreviation: string; level: number };
  activiteId?: {
    _id: mongoose.Types.ObjectId;
    nom: string;
    dateDebut: Date;
    dateFin: Date;
    lieu: string;
    montant?: number;
    terminee?: boolean;
    image?: string;
  };
  nombreNotes: number;
};

type EvaluationReadersResult = {
  evaluation: { _id: string; terminee: boolean; publiee: boolean; nombreNotes: number };
  members: EvaluationReaderMemberRow[];
};

type EvaluationReaderMemberRow = {
  _id: string;
  lecteur: {
    _id: string;
    nom: string;
    prenoms: string;
    uniqueId: string;
    sexe: "M" | "F";
    gradeIdAtEvaluation?: { _id: string; name: string; abbreviation: string; level: number };
  };
  vicariat?: { _id?: string; name?: string; abbreviation?: string };
  paroisse?: { _id?: string; name?: string };
  moyenne?: number;
  decision?: "PROMU" | "MAINTENU" | string;
  notes: Array<{ noteIndex: number; valeur?: number; validated: boolean }>;
};

type EvaluationNoteLean = {
  _id?: mongoose.Types.ObjectId;
  evaluationId: mongoose.Types.ObjectId;
  lecteurId: mongoose.Types.ObjectId;
  noteIndex: number;
  valeur: number;
  validatedAt: Date;
};

type BulkUpdateOneOp = {
  updateOne: {
    filter: { _id: mongoose.Types.ObjectId };
    update: { $set: { moyenne: number; decision: "PROMU" | "MAINTENU"; computedAt: Date } };
  };
};

export class EvaluationRepository {
  async getEvaluations(): Promise<unknown[]> {
    await connectToDatabase();
    const rows = await Evaluation.find()
      .populate("gradeId", "name abbreviation level")
      .populate("activiteId", "nom dateDebut dateFin lieu montant terminee image")
      .sort({ annee: -1, createdAt: -1 })
      .lean();
    return rows;
  }

  async getEvaluationById(id: string): Promise<IEvaluation | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    return Evaluation.findById(id).lean();
  }

  async getEvaluationFull(id: string): Promise<EvaluationFullRow | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    await connectToDatabase();
    const row = await Evaluation.findById(id)
      .populate("gradeId", "name abbreviation level")
      .populate("activiteId", "nom dateDebut dateFin lieu montant terminee image")
      .lean();
    return row as unknown as EvaluationFullRow;
  }

  async createEvaluation(data: CreateEvaluationInput): Promise<EvaluationFullRow> {
    await connectToDatabase();

    // Règle TDR: il ne peut pas y avoir deux évaluations pour la même année.
    const existsForYear = await Evaluation.exists({ annee: data.annee });
    if (existsForYear) {
      throw new Error(`Une évaluation pour l'année ${data.annee} existe déjà`);
    }

    // Règle TDR: il ne peut pas y avoir deux évaluations avec le même nom.
    const normalizedNom = data.nom.trim();
    const existsForName = await Evaluation.exists({ nom: normalizedNom });
    if (existsForName) {
      throw new Error(`Une évaluation avec le nom "${normalizedNom}" existe déjà`);
    }

    const [e] = await Promise.all([
      Evaluation.create({
        nom: normalizedNom,
        annee: data.annee,
        gradeId: new mongoose.Types.ObjectId(data.gradeId),
        activiteId: new mongoose.Types.ObjectId(data.activiteId),
        nombreNotes: data.nombreNotes,
        terminee: false,
        publiee: false,
      }),
    ]);

    const created = await this.getEvaluationFull(e._id.toString());
    if (!created) throw new Error("Evaluation créée mais introuvable");

    // Auto-association : lecteurs participants à l'activité concernée,
    // et actuellement au grade concerné.
    await this.associateReaders(created._id.toString());

    return created;
  }

  private async associateReaders(evaluationId: string): Promise<void> {
    await connectToDatabase();

    const evaluation = await Evaluation.findById(evaluationId).lean();
    if (!evaluation) return;

    const gradeId = evaluation.gradeId as mongoose.Types.ObjectId;

    // TDR : une évaluation est associée aux lecteurs concernés par le grade.
    // L'API de détails permet ensuite de filtrer par vicariat/paroisse.
    const lecteurs = await Lecteur.find({ gradeId })
      .select("vicariatId paroisseId gradeId")
      .lean();

    if (lecteurs.length === 0) return;

    const ops = lecteurs.map((l) => ({
      evaluationId: new mongoose.Types.ObjectId(evaluationId),
      lecteurId: l._id,
      vicariatId: l.vicariatId,
      paroisseId: l.paroisseId,
      gradeIdAtEvaluation: l.gradeId,
    }));

    await EvaluationLecteur.insertMany(ops);
  }

  async updateEvaluation(id: string, data: UpdateEvaluationInput): Promise<EvaluationFullRow | null> {
    await connectToDatabase();
    const ev = await Evaluation.findById(id);
    if (!ev) return null;
    if (ev.terminee) {
      throw new Error("Impossible de modifier une évaluation terminée");
    }

    // Règle TDR: tant que l'évaluation est "en cours", seuls nombreNotes et activiteId peuvent être modifiés.
    if (data.nom !== undefined || data.annee !== undefined || data.gradeId !== undefined) {
      throw new Error("Une évaluation en cours ne peut être modifiée que sur nombreNotes et activiteId");
    }

    // Règle TDR: pas deux évaluations pour la même année.
    if (data.annee !== undefined && data.annee !== ev.annee) {
      const conflict = await Evaluation.findOne({ annee: data.annee, _id: { $ne: ev._id } }).lean();
      if (conflict) throw new Error(`Une évaluation pour l'année ${data.annee} existe déjà`);
    }

    const prevNombreNotes = ev.nombreNotes;

    if (data.activiteId !== undefined) ev.activiteId = new mongoose.Types.ObjectId(data.activiteId);
    if (data.nombreNotes !== undefined) ev.nombreNotes = data.nombreNotes;

    await ev.save();

    const evaluationObjectId = new mongoose.Types.ObjectId(id);

    const nombreNotesChanged = data.nombreNotes !== undefined && data.nombreNotes !== prevNombreNotes;
    const nextNombreNotes = ev.nombreNotes;

    // Sinon, si on réduit le nombre de notes, on supprime uniquement les notes "au-delà".
    if (nombreNotesChanged && nextNombreNotes < prevNombreNotes) {
      await EvaluationNote.deleteMany({
        evaluationId: evaluationObjectId,
        noteIndex: { $gt: nextNombreNotes },
      });
    }

    // Si on a seulement changé l'activité, aucune donnée de notes/associations n'est invalide.
    const full = await this.getEvaluationFull(id);
    return full as EvaluationFullRow | null;
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const evaluation = await Evaluation.findById(id).lean();
    if (!evaluation) return false;
    if (!evaluation.terminee) throw new Error("Impossible de supprimer une évaluation en cours");

    await EvaluationNote.deleteMany({ evaluationId: new mongoose.Types.ObjectId(id) });
    await EvaluationLecteur.deleteMany({ evaluationId: new mongoose.Types.ObjectId(id) });
    const res = await Evaluation.findByIdAndDelete(id);
    return !!res;
  }

  async upsertNote(evaluationId: string, payload: UpsertEvaluationNoteInput): Promise<{ success: true }> {
    await connectToDatabase();

    const { lecteurId, noteIndex, valeur } = payload;
    const ev = await Evaluation.findById(evaluationId).lean();
    if (!ev) throw new Error("Evaluation introuvable");
    if (ev.terminee) throw new Error("Impossible de modifier une évaluation terminée");

    const membership = await EvaluationLecteur.findOne({
      evaluationId: new mongoose.Types.ObjectId(evaluationId),
      lecteurId: new mongoose.Types.ObjectId(lecteurId),
    }).lean();
    if (!membership) throw new Error("Lecteur non concerné par cette évaluation");

    await EvaluationNote.updateOne(
      {
        evaluationId: new mongoose.Types.ObjectId(evaluationId),
        lecteurId: new mongoose.Types.ObjectId(lecteurId),
        noteIndex,
      },
      {
        $set: {
          valeur,
          validatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true };
  }

  async getEvaluationReaders(
    evaluationId: string,
    opts: { vicariatId?: string; paroisseId?: string }
  ): Promise<EvaluationReadersResult> {
    await connectToDatabase();

    const evaluation = await Evaluation.findById(evaluationId).lean() as unknown as
      | (Pick<IEvaluation, "_id" | "terminee" | "publiee" | "nombreNotes"> & { _id: mongoose.Types.ObjectId })
      | null;
    if (!evaluation) throw new Error("Evaluation introuvable");

    const q: {
      evaluationId: mongoose.Types.ObjectId;
      vicariatId?: mongoose.Types.ObjectId;
      paroisseId?: mongoose.Types.ObjectId;
    } = { evaluationId: new mongoose.Types.ObjectId(evaluationId) };
    if (opts.vicariatId) q.vicariatId = new mongoose.Types.ObjectId(opts.vicariatId);
    if (opts.paroisseId) q.paroisseId = new mongoose.Types.ObjectId(opts.paroisseId);

    const members = (await EvaluationLecteur.find(q)
      // Réduction du payload: on ne garde que les champs réellement utilisés.
      .select("lecteurId vicariatId paroisseId gradeIdAtEvaluation moyenne decision")
      // Réduction du payload: la page détails n'utilise que nom/prénoms/uniqueId/sexe (et le grade "au moment de l'évaluation"
      // vient de `gradeIdAtEvaluation`).
      .populate("lecteurId", "nom prenoms uniqueId sexe")
      .populate("vicariatId", "name abbreviation")
      .populate("paroisseId", "name")
      .populate("gradeIdAtEvaluation", "name abbreviation level")
      .sort({ "lecteurId.nom": 1, "lecteurId.prenoms": 1 })
      .lean()) as unknown as Array<{
      _id: mongoose.Types.ObjectId;
      lecteurId: {
        _id: mongoose.Types.ObjectId;
        nom: string;
        prenoms: string;
        uniqueId: string;
        sexe: "M" | "F";
      };
      vicariatId?: { _id: mongoose.Types.ObjectId; name: string; abbreviation: string } | mongoose.Types.ObjectId;
      paroisseId?: { _id: mongoose.Types.ObjectId; name: string } | mongoose.Types.ObjectId;
      gradeIdAtEvaluation?: { _id: mongoose.Types.ObjectId; name: string; abbreviation: string; level: number } | mongoose.Types.ObjectId;
      moyenne?: number;
      decision?: "PROMU" | "MAINTENU";
    }>;

    const lecteurIds = members.map((m) => m.lecteurId._id.toString());
    const notes = (await EvaluationNote.find({
      evaluationId: new mongoose.Types.ObjectId(evaluationId),
      lecteurId: { $in: lecteurIds.map((x: string) => new mongoose.Types.ObjectId(x)) },
    })
      // Réduction du payload: on ne garde que ce dont on a besoin côté UI.
      .select("lecteurId noteIndex valeur validatedAt")
      .lean()) as unknown as EvaluationNoteLean[];

    const notesByLecteur: Record<string, Record<number, EvaluationNoteLean>> = {};
    for (const n of notes) {
      const lid = n.lecteurId.toString();
      notesByLecteur[lid] ??= {};
      notesByLecteur[lid][n.noteIndex] = n;
    }

    return {
      evaluation: {
        _id: evaluation._id.toString(),
        terminee: evaluation.terminee,
        publiee: evaluation.publiee,
        nombreNotes: evaluation.nombreNotes,
      },
      members: members.map((m) => {
        const lid = m.lecteurId._id.toString();
        const noteSlots = Array.from({ length: evaluation.nombreNotes }, (_, i) => i + 1).map((idx) => {
          const note = notesByLecteur[lid]?.[idx];
          return {
            noteIndex: idx,
            valeur: note ? note.valeur : undefined,
            validated: Boolean(note?.validatedAt),
          };
        });

        const gradeIdAtEvaluation = (() => {
          const g = m.gradeIdAtEvaluation as unknown;
          if (!g || typeof g !== "object") return undefined;
          if (!("_id" in (g as object)) || !("name" in (g as object))) return undefined;
          const gg = g as { _id: mongoose.Types.ObjectId; name: string; abbreviation: string; level: number };
          return { _id: gg._id.toString(), name: gg.name, abbreviation: gg.abbreviation, level: gg.level };
        })();

        const vicariat = (() => {
          const v = m.vicariatId as unknown;
          if (!v || typeof v !== "object") return undefined;
          if (!("_id" in (v as object)) || !("name" in (v as object)) || !("abbreviation" in (v as object))) return undefined;
          const vv = v as { _id: mongoose.Types.ObjectId; name: string; abbreviation: string };
          return { _id: vv._id.toString(), name: vv.name, abbreviation: vv.abbreviation };
        })();

        const paroisse = (() => {
          const p = m.paroisseId as unknown;
          if (!p || typeof p !== "object") return undefined;
          if (!("_id" in (p as object)) || !("name" in (p as object))) return undefined;
          const pp = p as { _id: mongoose.Types.ObjectId; name: string };
          return { _id: pp._id.toString(), name: pp.name };
        })();

        return {
          _id: m._id.toString(),
          lecteur: {
            _id: lid,
            nom: m.lecteurId.nom,
            prenoms: m.lecteurId.prenoms,
            uniqueId: m.lecteurId.uniqueId,
            sexe: m.lecteurId.sexe,
            gradeIdAtEvaluation,
          },
          vicariat,
          paroisse,
          moyenne: m.moyenne,
          decision: m.decision,
          notes: noteSlots,
        };
      }),
    };
  }

  async getLecteurPublishedEvaluations(lecteurId: string) {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(lecteurId)) return [];

    const lid = new mongoose.Types.ObjectId(lecteurId);

    const memberships = await EvaluationLecteur.find({ lecteurId: lid }).lean();
    if (!memberships.length) return [];

    const evaluationIds = [...new Set(memberships.map((m) => String(m.evaluationId)))];

    const evaluations = await Evaluation.find({
      _id: { $in: evaluationIds.map((id) => new mongoose.Types.ObjectId(id)) },
      publiee: true,
    })
      .populate("gradeId", "name abbreviation level")
      .populate("activiteId", "nom dateDebut dateFin lieu montant terminee image")
      .lean();

    const publieeEvaluationIds = new Set(evaluations.map((e) => String(e._id)));
    const visibleMemberships = memberships.filter((m) => publieeEvaluationIds.has(String(m.evaluationId)));

    const membersByEval = new Map<string, (typeof memberships)[number]>();
    for (const m of visibleMemberships) membersByEval.set(String(m.evaluationId), m);

    if (evaluations.length === 0) return [];

    const notes = await EvaluationNote.find({
      lecteurId: lid,
      evaluationId: { $in: evaluations.map((e) => e._id) },
    }).lean();

    type NoteSlot = { noteIndex: number; valeur: number | undefined; validated: boolean };
    const notesByEval: Record<string, Record<number, NoteSlot>> = {};
    for (const n of notes) {
      const eid = String(n.evaluationId);
      notesByEval[eid] ??= {};
      notesByEval[eid][n.noteIndex] = {
        noteIndex: n.noteIndex,
        valeur: n.valeur,
        validated: Boolean(n.validatedAt),
      };
    }

    const baseLevels = evaluations
      .map((e) => (e.gradeId as unknown as { level?: number })?.level)
      .filter((l): l is number => typeof l === "number" && Number.isFinite(l));

    const nextLevels = [...new Set(baseLevels.map((l) => l + 1))];
    const nextGrades = await Grade.find({ level: { $in: nextLevels } }).lean();
    const nextGradeByLevel = new Map<number, { _id: mongoose.Types.ObjectId; name: string; abbreviation: string; level: number }>(
      nextGrades.map((g) => [g.level, { _id: g._id, name: g.name, abbreviation: g.abbreviation, level: g.level }])
    );

    type LecteurPublishedEvaluation = {
      evaluationId: string;
      nom: string;
      annee: number;
      nombreNotes: number;
      grade: { name: string; abbreviation: string; level: number };
      gradeAffecte: { name: string; abbreviation: string; level: number };
      activite: {
        nom: string;
        dateDebut: Date;
        dateFin: Date;
        lieu: string;
        montant: number | undefined;
        image: string | undefined;
      };
      terminee: boolean;
      publiee: boolean;
      moyenne: number | undefined;
      decision: "PROMU" | "MAINTENU" | undefined;
      notes: Array<{ noteIndex: number; valeur: number | undefined; validated: boolean }>;
    };

    const result = evaluations
      .map((e) => {
        const eid = String(e._id);
        const membership = membersByEval.get(eid);
        if (!membership) return null;

        const nombreNotes = e.nombreNotes;
        const evalNotes: NoteSlot[] = Array.from({ length: nombreNotes }, (_, i) => i + 1).map((idx) => {
          return notesByEval[eid]?.[idx] ?? {
            noteIndex: idx,
            valeur: undefined,
            validated: false,
          };
        });

        const decision = membership.decision;
        const grade = e.gradeId as unknown as { name: string; abbreviation: string; level: number };
        const promotedLevel = (grade.level ?? 0) + 1;
        const gradeAffecte =
          decision === "PROMU"
            ? nextGradeByLevel.get(promotedLevel) ?? grade
            : grade;
        const activite = e.activiteId as unknown as {
          nom: string;
          dateDebut: Date;
          dateFin: Date;
          lieu: string;
          montant?: number;
          terminee?: boolean;
          image?: string;
        };

        return {
          evaluationId: eid,
          nom: e.nom,
          annee: e.annee,
          nombreNotes: e.nombreNotes,
          grade: { name: grade.name, abbreviation: grade.abbreviation, level: grade.level },
          gradeAffecte: {
            name: gradeAffecte.name,
            abbreviation: gradeAffecte.abbreviation,
            level: gradeAffecte.level,
          },
          activite: {
            nom: activite.nom,
            dateDebut: activite.dateDebut,
            dateFin: activite.dateFin,
            lieu: activite.lieu,
            montant: activite.montant,
            image: activite.image,
          },
          terminee: Boolean(e.terminee),
          publiee: Boolean(e.publiee),
          moyenne: membership.moyenne,
          decision: membership.decision,
          notes: evalNotes.map((n) => ({ noteIndex: n.noteIndex, valeur: n.valeur, validated: n.validated })),
        };
      })
      .filter((x): x is LecteurPublishedEvaluation => x !== null);

    result.sort((a, b) => Number(b.annee) - Number(a.annee));
    return result;
  }

  async hasAnyEvaluationForLecteur(lecteurId: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(lecteurId)) return false;

    const lid = new mongoose.Types.ObjectId(lecteurId);
    const exists = await EvaluationLecteur.exists({ lecteurId: lid });
    return !!exists;
  }

  async markTerminee(evaluationId: string): Promise<{ promotedCount: number; maintainedCount: number }> {
    await connectToDatabase();

    const evaluation = await Evaluation.findById(evaluationId)
      .populate("gradeId", "level")
      .lean();
    if (!evaluation) throw new Error("Evaluation introuvable");
    if (evaluation.terminee) return { promotedCount: 0, maintainedCount: 0 };

    const nombreNotes: number = evaluation.nombreNotes;
    // Note: la mise à jour du grade des lecteurs est faite uniquement lors du "publish".
    // Ici on calcule uniquement moyenne et décision pour chaque lecteur.
    const baseGradeLevel: number = (evaluation.gradeId as unknown as { level?: number }).level ?? 0;
    void baseGradeLevel;

    const members = (await EvaluationLecteur.find({
      evaluationId: new mongoose.Types.ObjectId(evaluationId),
    }).lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; lecteurId: mongoose.Types.ObjectId }>;

    const notesAgg = await EvaluationNote.aggregate([
      { $match: { evaluationId: new mongoose.Types.ObjectId(evaluationId) } },
      { $group: { _id: "$lecteurId", sumVal: { $sum: "$valeur" } } },
    ]);

    const sumByLecteur = new Map<string, number>(
      notesAgg.map((r) => [r._id.toString(), Number(r.sumVal) || 0])
    );

    const ops: BulkUpdateOneOp[] = [];
    let promotedCount = 0;
    let maintainedCount = 0;

    for (const m of members) {
      const lid = m.lecteurId.toString();
      const sumVal = sumByLecteur.get(lid) ?? 0;
      const moyenne = sumVal / nombreNotes;
      const decision = moyenne > 10 ? "PROMU" : "MAINTENU";

      ops.push({
        updateOne: {
          filter: { _id: m._id },
          update: { $set: { moyenne, decision, computedAt: new Date() } },
        },
      });

      if (decision === "PROMU") {
        promotedCount++;
      } else {
        maintainedCount++;
      }
    }

    if (ops.length) {
      await EvaluationLecteur.bulkWrite(ops);
    }

    await Evaluation.findByIdAndUpdate(evaluationId, { terminee: true }, { new: true }).lean();

    return { promotedCount, maintainedCount };
  }

  async publishEvaluation(evaluationId: string): Promise<unknown> {
    await connectToDatabase();
    const evaluation = await Evaluation.findById(evaluationId)
      .populate("gradeId", "level")
      .lean();
    if (!evaluation) throw new Error("Evaluation introuvable");
    if (!evaluation.terminee) throw new Error("L'évaluation doit être terminée avant d'être publiée");

    const baseGradeLevel: number = (evaluation.gradeId as unknown as { level?: number }).level ?? 0;
    const nextGrade = await Grade.findOne({ level: baseGradeLevel + 1 }).lean();

    // Promouvoir uniquement au moment du publish.
    if (nextGrade?._id) {
      const memberships = (await EvaluationLecteur.find({
        evaluationId: new mongoose.Types.ObjectId(evaluationId),
      }).lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; lecteurId: mongoose.Types.ObjectId; decision?: "PROMU" | "MAINTENU" | string }>;

      const toPromote = memberships
        .filter((m) => m.decision === "PROMU")
        .map((m) => m.lecteurId);

      if (toPromote.length) {
        await Lecteur.updateMany(
          { _id: { $in: toPromote } },
          { $set: { gradeId: nextGrade._id } }
        );
      }
    }

    const updated = await Evaluation.findByIdAndUpdate(
      evaluationId,
      { publiee: true },
      { new: true }
    )
      .populate("gradeId", "name abbreviation level")
      .populate("activiteId", "nom dateDebut dateFin lieu montant terminee image")
      .lean();

    return updated;
  }
}


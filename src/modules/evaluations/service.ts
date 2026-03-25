import { EvaluationRepository } from "./repository";
import { CreateEvaluationInput, UpdateEvaluationInput, UpsertEvaluationNoteInput } from "./schema";

export class EvaluationService {
  private repo = new EvaluationRepository();

  getEvaluations() {
    return this.repo.getEvaluations();
  }

  getEvaluationDetails(evaluationId: string) {
    return this.repo.getEvaluationFull(evaluationId);
  }

  getEvaluationReaders(evaluationId: string, opts: { vicariatId?: string; paroisseId?: string }) {
    return this.repo.getEvaluationReaders(evaluationId, opts);
  }

  createEvaluation(data: CreateEvaluationInput) {
    return this.repo.createEvaluation(data);
  }

  updateEvaluation(evaluationId: string, data: UpdateEvaluationInput) {
    return this.repo.updateEvaluation(evaluationId, data);
  }

  deleteEvaluation(evaluationId: string) {
    return this.repo.deleteEvaluation(evaluationId);
  }

  upsertNote(evaluationId: string, payload: UpsertEvaluationNoteInput) {
    return this.repo.upsertNote(evaluationId, payload);
  }

  markTerminee(evaluationId: string) {
    return this.repo.markTerminee(evaluationId);
  }

  publishEvaluation(evaluationId: string) {
    return this.repo.publishEvaluation(evaluationId);
  }

  getLecteurPublishedEvaluations(lecteurId: string) {
    return this.repo.getLecteurPublishedEvaluations(lecteurId);
  }

  hasAnyEvaluationForLecteur(lecteurId: string) {
    return this.repo.hasAnyEvaluationForLecteur(lecteurId);
  }
}


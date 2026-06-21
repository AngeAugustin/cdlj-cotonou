import { EvaluationRepository } from "./repository";
import { CreateEvaluationInput, UpdateEvaluationInput, UpsertEvaluationNoteInput } from "./schema";

export class EvaluationService {
  private repo = new EvaluationRepository();

  getEvaluations() {
    return this.repo.getEvaluations();
  }

  countOpenEvaluations() {
    return this.repo.countOpenEvaluations();
  }

  findFirstOpenEvaluation() {
    return this.repo.findFirstOpenEvaluation();
  }

  getPublishedEvaluations() {
    return this.repo.getPublishedEvaluations();
  }

  countPublishedEvaluations() {
    return this.repo.countPublishedEvaluations();
  }

  findFirstPublishedEvaluation() {
    return this.repo.findFirstPublishedEvaluation();
  }

  getEvaluationDetails(evaluationId: string) {
    return this.repo.getEvaluationFull(evaluationId);
  }

  getEvaluationReaders(evaluationId: string, opts: { vicariatId?: string; paroisseId?: string }) {
    return this.repo.getEvaluationReaders(evaluationId, opts);
  }

  getEvaluationReadersForExport(evaluationId: string) {
    return this.repo.getEvaluationReadersForExport(evaluationId);
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

  getPublicLecteurResultForYear(uniqueId: string, year?: number) {
    return this.repo.getPublicLecteurResultForYear(uniqueId, year);
  }

  hasAnyEvaluationForLecteur(lecteurId: string) {
    return this.repo.hasAnyEvaluationForLecteur(lecteurId);
  }
}


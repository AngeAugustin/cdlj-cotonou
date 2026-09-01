import { EvaluationRepository } from "./repository";
import { ResultatPaiementsRepository } from "./resultatPaiementsRepository";
import { CreateEvaluationInput, UpdateEvaluationInput, UpsertEvaluationNoteInput } from "./schema";

export class EvaluationService {
  private repo = new EvaluationRepository();
  private paiementsRepo = new ResultatPaiementsRepository();

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

  reopenEvaluation(evaluationId: string) {
    return this.repo.reopenEvaluation(evaluationId);
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

  checkPublicResultConsultation(uniqueId: string, year?: number) {
    return this.repo.checkPublicResultConsultation(uniqueId, year);
  }

  hasApprovedResultConsultationPayment(lecteurId: string, annee: number) {
    return this.paiementsRepo.hasApprovedPayment(lecteurId, annee);
  }

  createResultatPaiementDoc(data: Parameters<ResultatPaiementsRepository["createPaiementDoc"]>[0]) {
    return this.paiementsRepo.createPaiementDoc(data);
  }

  updateResultatPaiementById(id: string, patch: Parameters<ResultatPaiementsRepository["updatePaiementById"]>[1]) {
    return this.paiementsRepo.updatePaiementById(id, patch);
  }

  findResultatPaiementById(id: string) {
    return this.paiementsRepo.findPaiementById(id);
  }

  findReusableOpenResultatPaiement(opts: Parameters<ResultatPaiementsRepository["findReusableOpenPaiement"]>[0]) {
    return this.paiementsRepo.findReusableOpenPaiement(opts);
  }

  listResultatPaiementsForEvaluation(
    evaluationId: string,
    opts?: Parameters<ResultatPaiementsRepository["listPaiementsForEvaluation"]>[1]
  ) {
    return this.paiementsRepo.listPaiementsForEvaluation(evaluationId, opts);
  }

  hasAnyEvaluationForLecteur(lecteurId: string) {
    return this.repo.hasAnyEvaluationForLecteur(lecteurId);
  }
}


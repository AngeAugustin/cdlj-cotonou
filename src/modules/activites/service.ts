import { ActiviteRepository } from "./repository";
import { CreateActiviteInput, UpdateActiviteInput } from "./schema";
import { validateGrillePenalite } from "./penalites";

export class ActiviteService {
  private repo = new ActiviteRepository();

  getActivites() {
    return this.repo.findAll();
  }

  countOpenActivites() {
    return this.repo.countOpen();
  }

  findRecentActivites(limit: number) {
    return this.repo.findRecent(limit);
  }

  listOpenActivitesForPresence() {
    return this.repo.listOpenForPresence();
  }

  getActivite(id: string) {
    return this.repo.findById(id);
  }

  createActivite(data: CreateActiviteInput) {
    return this.repo.create(data);
  }

  async updateActivite(id: string, data: UpdateActiviteInput) {
    if (data.grillePenalite !== undefined || data.delaiPaiement !== undefined) {
      const existing = await this.repo.findById(id);
      if (!existing) return null;
      const delai = data.delaiPaiement ?? (existing.delaiPaiement as Date).toISOString();
      const grille =
        data.grillePenalite ??
        ((existing.grillePenalite as { dateDebut: Date; dateFin: Date; montantSupplementaire: number }[] | undefined) ?? []).map(
          (p) => ({
            dateDebut: p.dateDebut.toISOString(),
            dateFin: p.dateFin.toISOString(),
            montantSupplementaire: p.montantSupplementaire,
          })
        );
      const err = validateGrillePenalite(delai, grille);
      if (err) throw new Error(err);
    }
    return this.repo.update(id, data);
  }

  deleteActivite(id: string) {
    return this.repo.delete(id);
  }

  marquerTerminee(id: string) {
    return this.repo.setTerminee(id, true);
  }

  listParticipationLecteurIds(activiteId: string, paroisseId?: string) {
    return this.repo.listParticipationLecteurIds(activiteId, paroisseId);
  }

  enregistrerPaiement(activiteId: string, lecteurIds: string[], paroisseId: string, paiementId?: string) {
    return this.repo.addParticipations(activiteId, lecteurIds, paroisseId, paiementId);
  }

  annulerParticipationsPourRemboursement(paiementId: string, reason?: string) {
    return this.repo.markParticipationsRefundedByPaymentId(paiementId, reason);
  }

  createPaiementDoc(
    data: Parameters<ActiviteRepository["createPaiementDoc"]>[0]
  ) {
    return this.repo.createPaiementDoc(data);
  }

  updatePaiementById(id: string, patch: Parameters<ActiviteRepository["updatePaiementById"]>[1]) {
    return this.repo.updatePaiementById(id, patch);
  }

  findPaiementById(id: string) {
    return this.repo.findPaiementById(id);
  }

  findPaiementByFedapayTransactionId(txId: number) {
    return this.repo.findPaiementByFedapayTransactionId(txId);
  }

  findReusableOpenPaiement(opts: Parameters<ActiviteRepository["findReusableOpenPaiement"]>[0]) {
    return this.repo.findReusableOpenPaiement(opts);
  }

  listPaiementsForReconciliation(limit?: number) {
    return this.repo.listPaiementsForReconciliation(limit);
  }

  listPaiementsForActivite(activiteId: string, opts?: Parameters<ActiviteRepository["listPaiementsForActivite"]>[1]) {
    return this.repo.listPaiementsForActivite(activiteId, opts);
  }

  listParticipantsDetail(
    activiteId: string,
    scope?: { paroisseId?: string; paroisseIds?: string[] }
  ) {
    return this.repo.listParticipantsWithLecteur(activiteId, scope);
  }

  findParticipantByUniqueId(activiteId: string, uniqueId: string) {
    return this.repo.findParticipantByUniqueId(activiteId, uniqueId);
  }

  validatePresenceByUniqueId(activiteId: string, uniqueId: string) {
    return this.repo.validatePresenceByUniqueId(activiteId, uniqueId);
  }

  listValidatedPresencesDetail(activiteId: string) {
    return this.repo.listValidatedPresencesWithLecteur(activiteId);
  }

  async getStats(activiteId: string, vicariatId?: string | null) {
    const totalLecteurs = await this.repo.countLecteurs(vicariatId ?? undefined);
    const totalParticipants = await this.repo.countParticipantsForActivite(activiteId, vicariatId);
    const byParoisse = await this.repo.statsByParoisse(activiteId, vicariatId);
    return { totalLecteurs, totalParticipants, byParoisse };
  }

  countParticipantsForParoisse(activiteId: string, paroisseId: string) {
    return this.repo.countParticipantsForActiviteParoisse(activiteId, paroisseId);
  }

  countParticipantsForActivite(activiteId: string, vicariatId?: string | null) {
    return this.repo.countParticipantsForActivite(activiteId, vicariatId);
  }
}

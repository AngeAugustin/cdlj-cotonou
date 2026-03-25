import { AssembleeGeneraleRepository } from "./repository";
import { CreateAssembleeGeneraleInput, UpdateAssembleeGeneraleInput, UpsertAssembleeRapportInput } from "./schema";

export class AssembleeGeneraleService {
  private repo = new AssembleeGeneraleRepository();

  getAssemblees() {
    return this.repo.findAll();
  }

  getAssemblee(id: string) {
    return this.repo.findById(id);
  }

  createAssemblee(data: CreateAssembleeGeneraleInput) {
    return this.repo.create(data);
  }

  updateAssemblee(id: string, data: UpdateAssembleeGeneraleInput) {
    return this.repo.update(id, data);
  }

  deleteAssemblee(id: string) {
    return this.repo.delete(id);
  }

  marquerTerminee(id: string) {
    return this.repo.setTerminee(id, true);
  }

  upsertRapport(assembleeId: string, vicariatId: string | null, payload: UpsertAssembleeRapportInput) {
    return this.repo.upsertRapport(assembleeId, vicariatId, payload);
  }

  getRapportForVicariat(assembleeId: string, vicariatId: string | null) {
    return this.repo.getRapportForVicariat(assembleeId, vicariatId);
  }

  listRapportsForAssemblee(assembleeId: string, opts?: { viewerVicariatId?: string | null }) {
    return this.repo.listRapportsForAssemblee(assembleeId, opts);
  }
}


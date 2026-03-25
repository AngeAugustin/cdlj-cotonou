import { ActualiteRepository } from "./repository";
import { CreateActualiteInput, UpdateActualiteInput } from "./schema";

export class ActualiteService {
  private repo = new ActualiteRepository();

  async getActualites(publishedOnly = false) {
    return this.repo.findAll(publishedOnly);
  }

  async getActualiteBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async getActualiteById(id: string) {
    return this.repo.findById(id);
  }

  async createActualite(data: CreateActualiteInput) {
    return this.repo.create(data);
  }

  async updateActualite(id: string, data: UpdateActualiteInput) {
    return this.repo.update(id, data);
  }

  async deleteActualite(id: string) {
    return this.repo.delete(id);
  }
}

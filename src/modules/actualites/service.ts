import { ActualiteRepository } from "./repository";
import { CreateActualiteInput, UpdateActualiteInput } from "./schema";
import { sanitizeArticleHtml } from "@/lib/sanitizeHtml";

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
    return this.repo.create({
      ...data,
      body: sanitizeArticleHtml(data.body ?? ""),
    });
  }

  async updateActualite(id: string, data: UpdateActualiteInput) {
    const patch = { ...data };
    if (typeof patch.body === "string") {
      patch.body = sanitizeArticleHtml(patch.body);
    }
    return this.repo.update(id, patch);
  }

  async deleteActualite(id: string) {
    return this.repo.delete(id);
  }
}

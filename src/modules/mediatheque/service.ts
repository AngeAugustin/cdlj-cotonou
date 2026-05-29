import { MediathequeRepository } from "./repository";
import { CreateMediathequeInput, UpdateMediathequeInput } from "./schema";

export class MediathequeService {
  private repo = new MediathequeRepository();

  async getMediatheques(publishedOnly = false) {
    return this.repo.findAll(publishedOnly);
  }

  async getMediathequeById(id: string) {
    return this.repo.findById(id);
  }

  async createMediatheque(data: CreateMediathequeInput) {
    return this.repo.create(data);
  }

  async updateMediatheque(id: string, data: UpdateMediathequeInput) {
    return this.repo.update(id, data);
  }

  async deleteMediatheque(id: string) {
    return this.repo.delete(id);
  }
}

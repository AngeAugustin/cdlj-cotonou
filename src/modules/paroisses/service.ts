import { ParoisseRepository } from "./repository";
import { CreateParoisseInput, UpdateParoisseInput } from "./schema";

export class ParoisseService {
  private repo = new ParoisseRepository();

  async getParoisses(filters?: { vicariatId?: string }) {
    return this.repo.findAll(filters);
  }

  async createParoisse(data: CreateParoisseInput) {
    return this.repo.create(data);
  }

  async updateParoisse(id: string, data: UpdateParoisseInput) {
    return this.repo.update(id, data);
  }

  async deleteParoisse(id: string) {
    return this.repo.delete(id);
  }
}

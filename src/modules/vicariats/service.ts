import { VicariatRepository } from "./repository";
import { CreateVicariatInput, UpdateVicariatInput } from "./schema";

export class VicariatService {
  private repository: VicariatRepository;

  constructor() {
    this.repository = new VicariatRepository();
  }

  async createVicariat(data: CreateVicariatInput) {
    return this.repository.create(data);
  }

  async getVicariats() {
    return this.repository.findAll();
  }

  async getVicariatById(id: string) {
    return this.repository.findById(id);
  }

  async updateVicariat(id: string, data: UpdateVicariatInput) {
    return this.repository.update(id, data);
  }

  async deleteVicariat(id: string) {
    return this.repository.delete(id);
  }
}

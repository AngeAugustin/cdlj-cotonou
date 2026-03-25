import { LecteurRepository } from "./repository";
import { VicariatRepository } from "../vicariats/repository";
import { ParoisseRepository } from "../paroisses/repository";
import { CreateLecteurInput, UpdateLecteurInput } from "./schema";

export class LecteurService {
  private repository: LecteurRepository;
  private vicariatRepo: VicariatRepository;
  private paroisseRepo: ParoisseRepository;

  constructor() {
    this.repository = new LecteurRepository();
    this.vicariatRepo = new VicariatRepository();
    this.paroisseRepo = new ParoisseRepository();
  }

  private generateRandomDigits(length: number): string {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  private async generateUniqueId(vicariatId: string, paroisseId: string): Promise<string> {
    const vicariat = await this.vicariatRepo.findById(vicariatId);
    if (!vicariat) throw new Error("Vicariat not found");

    const paroisse = await this.paroisseRepo.findById(paroisseId);
    if (!paroisse) throw new Error("Paroisse not found");

    const vicNameMatch = vicariat.abbreviation.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const vicAbbr = vicNameMatch.substring(0, 3).padEnd(3, "X");

    // Get first 3 letters of parish name, remove spaces/special chars, upper case
    const parNameMatch = paroisse.name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const parAbbr = parNameMatch.substring(0, 3).padEnd(3, 'X'); 

    const randomDigits = this.generateRandomDigits(6);
    return `${vicAbbr}${parAbbr}${randomDigits}`;
  }

  async createLecteur(data: CreateLecteurInput) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const uniqueId = await this.generateUniqueId(data.vicariatId, data.paroisseId);
        return await this.repository.create({ ...data, uniqueId });
      } catch (e: unknown) {
        lastErr = e;
        const code = (e as { code?: number })?.code;
        if (code === 11000) continue;
        throw e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Impossible d’attribuer un numéro unique");
  }

  async getLecteurWithHistory(id: string) {
    const lecteur = await this.repository.findById(id);
    if (!lecteur) return null;
    const history = await this.repository.findParticipationHistory(id);
    return { lecteur, history };
  }

  async getLecteurs() {
    return this.repository.findAll();
  }

  async getLecteurById(id: string) {
    return this.repository.findById(id);
  }

  async getLecteursByParish(parishId: string) {
    return this.repository.findByParishId(parishId);
  }

  async getLecteursByVicariat(vicariatId: string) {
    return this.repository.findByVicariatId(vicariatId);
  }

  async updateLecteur(id: string, data: UpdateLecteurInput) {
    return this.repository.update(id, data);
  }

  async deleteLecteur(id: string) {
    return this.repository.delete(id);
  }
}

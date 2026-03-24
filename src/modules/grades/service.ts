import { GradeRepository } from "./repository";
import { CreateGradeInput, UpdateGradeInput } from "./schema";
import connectToDatabase from "@/lib/mongoose";
import { Lecteur } from "@/modules/lecteurs/model";
import { Grade } from "./model";

export class GradeService {
  private repository: GradeRepository;

  constructor() {
    this.repository = new GradeRepository();
  }

  async createGrade(data: CreateGradeInput) {
    await connectToDatabase();
    const existing = await Grade.findOne({ level: data.level });
    if (existing) {
      throw new Error(`Un grade avec le niveau ${data.level} existe déjà.`);
    }
    return this.repository.create(data);
  }

  async getGrades() {
    return this.repository.findAll();
  }
  
  async getGradesWithLecteurCount() {
    const grades = await this.getGrades();
    await connectToDatabase();
    
    const gradesWithCounts = await Promise.all(
      grades.map(async (grade) => {
        const count = await Lecteur.countDocuments({ gradeId: grade._id });
        return {
          ...grade,
          lecteurCount: count
        };
      })
    );
    
    return gradesWithCounts;
  }

  async getGradeById(id: string) {
    return this.repository.findById(id);
  }

  async updateGrade(id: string, data: UpdateGradeInput) {
    if (data.level !== undefined) {
      await connectToDatabase();
      const existing = await Grade.findOne({ level: data.level, _id: { $ne: id } });
      if (existing) {
        throw new Error(`Un grade avec le niveau ${data.level} existe déjà.`);
      }
    }
    return this.repository.update(id, data);
  }

  async deleteGrade(id: string) {
    return this.repository.delete(id);
  }
}

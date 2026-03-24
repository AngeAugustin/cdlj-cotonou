import { Grade, IGrade } from "./model";
import connectToDatabase from "@/lib/mongoose";
import { CreateGradeInput, UpdateGradeInput } from "./schema";

export class GradeRepository {
  async findAll(): Promise<IGrade[]> {
    await connectToDatabase();
    return Grade.find().sort({ level: 1 }).lean();
  }

  async findById(id: string): Promise<IGrade | null> {
    await connectToDatabase();
    return Grade.findById(id).lean();
  }

  async create(data: CreateGradeInput): Promise<IGrade> {
    await connectToDatabase();
    const newGrade = new Grade(data);
    return newGrade.save();
  }

  async update(id: string, data: UpdateGradeInput): Promise<IGrade | null> {
    await connectToDatabase();
    return Grade.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Grade.findByIdAndDelete(id);
    return !!result;
  }
}

import { Paroisse, IParoisse } from "./model";
import connectToDatabase from "@/lib/mongoose";

export class ParoisseRepository {
  async findById(id: string): Promise<IParoisse | null> {
    await connectToDatabase();
    return Paroisse.findById(id).lean();
  }
}

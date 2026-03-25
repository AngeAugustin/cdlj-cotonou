import { z } from "zod";

export const createParoisseSchema = z.object({
  name:          z.string().min(1, "Le nom de la paroisse est requis"),
  vicariatId:    z.string().min(1, "Le vicariat est requis"),
  cureName:      z.string().optional(),
  coordonnateur: z.string().optional(),
  logo:          z.string().optional(),
});

export const updateParoisseSchema = createParoisseSchema.partial();

export type CreateParoisseInput = z.infer<typeof createParoisseSchema>;
export type UpdateParoisseInput = z.infer<typeof updateParoisseSchema>;

import { z } from "zod";

export const createVicariatSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  abbreviation: z.string().min(2, "L'abréviation doit faire au moins 2 caractères"),
  aumonier: z.string().optional(),
  logo: z.string().optional(),
});

export const updateVicariatSchema = createVicariatSchema.partial();

export type CreateVicariatInput = z.infer<typeof createVicariatSchema>;
export type UpdateVicariatInput = z.infer<typeof updateVicariatSchema>;

import { z } from "zod";

export const createActualiteSchema = z.object({
  title:      z.string().min(1),
  excerpt:    z.string().min(1),
  body:       z.string().default(""),   // HTML rich text
  image:      z.string().optional(),
  category:   z.string().min(1),
  author:     z.string().min(1),
  authorRole: z.string().optional(),
  readTime:   z.string().optional(),
  featured:   z.boolean().default(false),
  published:  z.boolean().default(false),
});

export const updateActualiteSchema = createActualiteSchema.partial();

export type CreateActualiteInput = z.infer<typeof createActualiteSchema>;
export type UpdateActualiteInput = z.infer<typeof updateActualiteSchema>;

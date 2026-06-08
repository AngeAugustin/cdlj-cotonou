import { z } from "zod";

export const createCommentSchema = z.object({
  authorName: z.string().trim().min(1, "Prénom requis").max(60),
  content:    z.string().trim().min(1, "Commentaire requis").max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

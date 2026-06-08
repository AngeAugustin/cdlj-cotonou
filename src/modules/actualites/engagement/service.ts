import type { VisitorContext } from "@/lib/visitor";
import { ActualiteEngagementRepository } from "./repository";
import type { CreateCommentInput } from "./schema";

export class ActualiteEngagementService {
  private repo = new ActualiteEngagementRepository();

  async getPublicEngagement(slug: string, visitor: VisitorContext | null) {
    const article = await this.repo.findPublishedBySlug(slug);
    if (!article) return null;

    const actualiteId = String(article._id);
    const [counters, comments, hasLiked] = await Promise.all([
      this.repo.getCounters(actualiteId),
      this.repo.getComments(actualiteId),
      visitor ? this.repo.hasLiked(actualiteId, visitor) : Promise.resolve(false),
    ]);

    return {
      actualiteId,
      ...counters,
      hasLiked,
      comments,
    };
  }

  async recordView(slug: string, visitor: VisitorContext | null) {
    if (!visitor) return null;
    const article = await this.repo.findPublishedBySlug(slug);
    if (!article) return null;
    await this.repo.recordView(String(article._id), visitor);
    return this.repo.getCounters(String(article._id));
  }

  async addLike(slug: string, visitor: VisitorContext | null) {
    if (!visitor) return null;
    const article = await this.repo.findPublishedBySlug(slug);
    if (!article) return null;
    const actualiteId = String(article._id);
    const added = await this.repo.addLike(actualiteId, visitor);
    const counters = await this.repo.getCounters(actualiteId);
    return { added, ...counters, hasLiked: true };
  }

  async addComment(slug: string, visitor: VisitorContext | null, data: CreateCommentInput) {
    if (!visitor) return null;
    const article = await this.repo.findPublishedBySlug(slug);
    if (!article) return null;
    const actualiteId = String(article._id);
    const comment = await this.repo.addComment(actualiteId, visitor, data);
    const counters = await this.repo.getCounters(actualiteId);
    return { comment, ...counters };
  }

  async deleteComment(actualiteId: string, commentId: string) {
    return this.repo.deleteComment(actualiteId, commentId);
  }

  async getAdminStats(actualiteId: string) {
    const article = await this.repo.findById(actualiteId);
    if (!article) return null;
    return this.repo.getAdminStats(actualiteId);
  }
}

import connectToDatabase from "@/lib/mongoose";
import type { VisitorContext } from "@/lib/visitor";
import { Types } from "mongoose";
import { Actualite } from "../model";
import { ActualiteView, ActualiteLike, ActualiteComment } from "./model";
import type { CreateCommentInput } from "./schema";

const SPAM_WINDOW_MS = 5 * 60 * 1000;

function geoPayload(geo: VisitorContext["geo"]) {
  return {
    country: geo.country ?? undefined,
    city: geo.city ?? undefined,
    region: geo.region ?? undefined,
  };
}

export type PublicComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  country: string | null;
  city: string | null;
};

export type GeoBreakdown = {
  country: string;
  city: string | null;
  count: number;
};

export type EngagementStats = {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewsByLocation: GeoBreakdown[];
  likesByLocation: GeoBreakdown[];
  commentsByLocation: GeoBreakdown[];
  recentViews: Array<{ createdAt: string; country: string | null; city: string | null; region: string | null }>;
  recentLikes: Array<{ createdAt: string; country: string | null; city: string | null; region: string | null }>;
  comments: Array<PublicComment & { region: string | null }>;
};

async function aggregateByLocation(
  model: typeof ActualiteView | typeof ActualiteLike | typeof ActualiteComment,
  actualiteId: string
): Promise<GeoBreakdown[]> {
  const rows = await model.aggregate<{ _id: { country: string; city: string | null }; count: number }>([
    { $match: { actualiteId: new Types.ObjectId(actualiteId) } },
    {
      $group: {
        _id: {
          country: { $ifNull: ["$country", "Inconnu"] },
          city: "$city",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return rows.map((r) => ({
    country: r._id.country,
    city: r._id.city,
    count: r.count,
  }));
}

export class ActualiteEngagementRepository {
  async findPublishedBySlug(slug: string) {
    await connectToDatabase();
    return Actualite.findOne({ slug, published: true }).lean();
  }

  async findById(id: string) {
    await connectToDatabase();
    return Actualite.findById(id).lean();
  }

  async recordView(actualiteId: string, visitor: VisitorContext) {
    await connectToDatabase();
    await ActualiteView.create({
      actualiteId,
      visitorId: visitor.visitorId,
      ipHash: visitor.ipHash,
      ...geoPayload(visitor.geo),
    });
    await Actualite.findByIdAndUpdate(actualiteId, { $inc: { viewCount: 1 } });
  }

  async hasLiked(actualiteId: string, visitor: VisitorContext) {
    await connectToDatabase();
    const existing = await ActualiteLike.findOne({
      actualiteId,
      $or: [{ visitorId: visitor.visitorId }, { ipHash: visitor.ipHash }],
    }).lean();
    return !!existing;
  }

  async addLike(actualiteId: string, visitor: VisitorContext) {
    await connectToDatabase();
    const existing = await ActualiteLike.findOne({
      actualiteId,
      $or: [{ visitorId: visitor.visitorId }, { ipHash: visitor.ipHash }],
    }).lean();
    if (existing) return false;

    try {
      await ActualiteLike.create({
        actualiteId,
        visitorId: visitor.visitorId,
        ipHash: visitor.ipHash,
        ...geoPayload(visitor.geo),
      });
      await Actualite.findByIdAndUpdate(actualiteId, { $inc: { likeCount: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  async getComments(actualiteId: string, limit = 50): Promise<PublicComment[]> {
    await connectToDatabase();
    const rows = await ActualiteComment.find({ actualiteId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return rows.map((r) => ({
      id: String(r._id),
      authorName: r.authorName,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      country: r.country ?? null,
      city: r.city ?? null,
    }));
  }

  async addComment(actualiteId: string, visitor: VisitorContext, data: CreateCommentInput) {
    await connectToDatabase();
    const since = new Date(Date.now() - SPAM_WINDOW_MS);
    const recent = await ActualiteComment.findOne({
      ipHash: visitor.ipHash,
      createdAt: { $gte: since },
    }).lean();
    if (recent) {
      throw new Error("SPAM_LIMIT");
    }

    const comment = await ActualiteComment.create({
      actualiteId,
      authorName: data.authorName,
      content: data.content,
      visitorId: visitor.visitorId,
      ipHash: visitor.ipHash,
      ...geoPayload(visitor.geo),
    });
    await Actualite.findByIdAndUpdate(actualiteId, { $inc: { commentCount: 1 } });

    return {
      id: String(comment._id),
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      country: comment.country ?? null,
      city: comment.city ?? null,
    } satisfies PublicComment;
  }

  async deleteComment(actualiteId: string, commentId: string) {
    await connectToDatabase();
    const deleted = await ActualiteComment.findOneAndDelete({
      _id: commentId,
      actualiteId,
    }).lean();
    if (!deleted) return false;
    await Actualite.findByIdAndUpdate(actualiteId, { $inc: { commentCount: -1 } });
    return true;
  }

  async getCounters(actualiteId: string) {
    await connectToDatabase();
    const article = await Actualite.findById(actualiteId).select("viewCount likeCount commentCount").lean();
    return {
      viewCount: article?.viewCount ?? 0,
      likeCount: article?.likeCount ?? 0,
      commentCount: article?.commentCount ?? 0,
    };
  }

  async getAdminStats(actualiteId: string): Promise<EngagementStats> {
    await connectToDatabase();
    const counters = await this.getCounters(actualiteId);

    const [viewsByLocation, likesByLocation, commentsByLocation, recentViews, recentLikes, commentRows] =
      await Promise.all([
        aggregateByLocation(ActualiteView, actualiteId),
        aggregateByLocation(ActualiteLike, actualiteId),
        aggregateByLocation(ActualiteComment, actualiteId),
        ActualiteView.find({ actualiteId }).sort({ createdAt: -1 }).limit(15).lean(),
        ActualiteLike.find({ actualiteId }).sort({ createdAt: -1 }).limit(15).lean(),
        ActualiteComment.find({ actualiteId }).sort({ createdAt: -1 }).limit(100).lean(),
      ]);

    return {
      ...counters,
      viewsByLocation,
      likesByLocation,
      commentsByLocation,
      recentViews: recentViews.map((r) => ({
        createdAt: r.createdAt.toISOString(),
        country: r.country ?? null,
        city: r.city ?? null,
        region: r.region ?? null,
      })),
      recentLikes: recentLikes.map((r) => ({
        createdAt: r.createdAt.toISOString(),
        country: r.country ?? null,
        city: r.city ?? null,
        region: r.region ?? null,
      })),
      comments: commentRows.map((r) => ({
        id: String(r._id),
        authorName: r.authorName,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        country: r.country ?? null,
        city: r.city ?? null,
        region: r.region ?? null,
      })),
    };
  }
}

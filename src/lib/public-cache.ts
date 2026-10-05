/** @deprecated Prefer `@/lib/public-mediatheque-cache` or `@/lib/public-news-cache`. */
export {
  getPublishedMediatheques,
  getMediathequeBySlug,
  getMediathequeById,
} from "@/lib/public-mediatheque-cache";

export {
  getPublishedNews,
  getNewsBySlug,
  type PublicNewsPost,
  type PublicNewsDetail,
} from "@/lib/public-news-cache";

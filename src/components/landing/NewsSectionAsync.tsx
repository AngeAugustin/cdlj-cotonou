import { NewsSection } from "@/components/landing/NewsSection";
import { getPublishedNews, type PublicNewsDetail } from "@/lib/public-news-cache";

export async function NewsSectionAsync() {
  let posts: PublicNewsDetail[] = [];

  try {
    posts = await getPublishedNews();
  } catch {
    posts = [];
  }

  return <NewsSection posts={posts} />;
}

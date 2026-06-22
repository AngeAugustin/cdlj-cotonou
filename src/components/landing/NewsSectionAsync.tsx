import { getPublishedNews } from "@/lib/public-cache";
import { NewsSection } from "@/components/landing/NewsSection";
import type { PublicNewsDetail } from "@/lib/public-cache";

export async function NewsSectionAsync() {
  let posts: PublicNewsDetail[] = [];

  try {
    posts = await getPublishedNews();
  } catch {
    posts = [];
  }

  return <NewsSection posts={posts} />;
}

import { getPublishedNews } from "@/lib/public-cache";
import {
  NewsRetroNewspaper,
  type NewspaperStory,
} from "@/components/news/NewsRetroNewspaper";

const FALLBACK_STORIES: NewspaperStory[] = [
  {
    title: "Celebration de la fête des mères : la CDLJ sacrifie à la tradition",
    category: "Célébration",
    excerpt:
      "Retour sur la célébration de la Fête des Mères dans une ambiance empreinte de gratitude et de fraternité.",
    date: "À la une",
  },
  {
    title: "SE CONSTRUIRE POUR MIEUX SERVIR — weekend de formation",
    category: "Formation",
    excerpt: "Les animateurs lecteurs se retrouvent pour grandir dans le service.",
  },
  {
    title: "Bonne fête des Pères à notre Papa-Parrain",
    category: "Communauté",
    excerpt: "Un hommage au guide et soutien de la communauté diocésaine.",
  },
];

export async function NewsHeroNewspaperAsync() {
  let stories: NewspaperStory[] = FALLBACK_STORIES;

  try {
    const posts = await getPublishedNews();
    if (posts.length > 0) {
      const ordered = [...posts].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      stories = ordered.slice(0, 3).map((post, index) => ({
        title: post.title,
        category: index === 0 ? `À la une · ${post.category}` : post.category,
        excerpt: post.excerpt,
        date: post.date,
        image: index === 0 ? post.image : undefined,
        slug: post.slug,
      }));
    }
  } catch {
    // keep fallbacks
  }

  return <NewsRetroNewspaper stories={stories} />;
}

import { getPublishedMediatheques } from "@/lib/public-cache";
import { formatMediathequeDate } from "@/modules/mediatheque/constants";
import {
  MediathequeRetroTv,
  type RetroTvSlide,
} from "@/components/mediatheque/MediathequeRetroTv";

const FALLBACK_SLIDES: RetroTvSlide[] = [
  {
    category: "Session Diocésaine",
    title: "Archives photos & moments forts",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  },
  {
    category: "Weekend de formation",
    title: "Retour en images — Glo-Yèkon",
    image: "https://i.postimg.cc/WzL22YRK/about.png",
  },
  {
    category: "Liturgie",
    title: "Célébrations et temps de prière",
    image: "/images/20240630_110241 (1).jpg",
  },
];

export async function MediathequeHeroTvAsync() {
  let slides: RetroTvSlide[] = FALLBACK_SLIDES;

  try {
    const items = await getPublishedMediatheques();
    const withCover = items
      .filter((item) => Boolean(item.coverImage))
      .slice(0, 5)
      .map((item) => ({
        title: item.nom,
        category: `${item.categorie} · ${formatMediathequeDate(item.mois, item.annee)}`,
        image: item.coverImage,
      }));

    if (withCover.length > 0) {
      slides = withCover;
    }
  } catch {
    // keep fallbacks
  }

  return <MediathequeRetroTv slides={slides} />;
}

import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { MediathequeSection } from "@/components/landing/MediathequeSection";
import FaqSection from "@/components/FaqSection";
import { MediathequeService } from "@/modules/mediatheque/service";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

async function getPublishedMediatheques(): Promise<PublicMediathequeItem[]> {
  try {
    const service = new MediathequeService();
    const data = await service.getMediatheques(true);
    return data.map((d) => ({
      _id: String(d._id),
      nom: d.nom,
      categorie: d.categorie,
      mois: d.mois,
      annee: d.annee,
      coverImage: d.coverImage,
      hostingLink: d.hostingLink,
    }));
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const mediathequeItems = await getPublishedMediatheques();

  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <HeroSection />
      <MarqueeStrip />
      <FeaturesBento />
      <MediathequeSection items={mediathequeItems} />
      <FaqSection />
    </div>
  );
}

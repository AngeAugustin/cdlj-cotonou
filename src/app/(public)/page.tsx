import { Suspense } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { MediathequeSectionAsync } from "@/components/landing/MediathequeSectionAsync";
import FaqSection from "@/components/FaqSection";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { lecteursSeoPhrase } from "@/config/community-stats";
import { SITE_TAGLINE } from "@/config/seo";
import { createPageMetadata } from "@/lib/seo";
import { faqPageSchema } from "@/lib/seo-schemas";

export const revalidate = 120;

export const metadata = createPageMetadata({
  title: SITE_TAGLINE,
  description:
    `Communauté Diocésaine des Lecteurs Juniors de l'Archidiocèse de Cotonou. Formation liturgique, animation paroissiale et fédération de ${lecteursSeoPhrase()} dans 15 vicariats forains.`,
  path: "/",
  keywords: [
    "CDLJ Cotonou",
    "lecteurs juniors Bénin",
    "communauté diocésaine",
    "formation liturgique",
  ],
});

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <JsonLd data={faqPageSchema()} />
      <HeroSection />
      <MarqueeStrip />
      <FeaturesBento />
      <Suspense fallback={<MediathequeGridSkeleton />}>
        <MediathequeSectionAsync />
      </Suspense>
      <FaqSection />
    </div>
  );
}

import { Suspense } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { MediathequeSectionAsync } from "@/components/landing/MediathequeSectionAsync";
import FaqSection from "@/components/FaqSection";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { faqPageSchema, webPageSchema } from "@/lib/seo-schemas";

export const revalidate = 120;

const seo = PAGE_SEO.home;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/",
  keywords: [...seo.keywords],
});

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <JsonLd
        data={[
          webPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/",
          }),
          faqPageSchema(),
        ]}
      />
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

import { Suspense } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { MediathequeSectionAsync } from "@/components/landing/MediathequeSectionAsync";
import FaqSection from "@/components/FaqSection";
import { MediathequeGridSkeleton } from "@/components/public/PublicPageSkeleton";

export const revalidate = 120;

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
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

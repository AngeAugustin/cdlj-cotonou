import { getPublishedMediatheques } from "@/lib/public-cache";
import { MediathequeSection } from "@/components/landing/MediathequeSection";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

export async function MediathequeSectionAsync() {
  let items: PublicMediathequeItem[] = [];

  try {
    items = await getPublishedMediatheques();
  } catch {
    items = [];
  }

  return <MediathequeSection items={items} />;
}

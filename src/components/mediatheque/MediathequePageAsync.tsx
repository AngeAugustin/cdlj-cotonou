import { getPublishedMediatheques } from "@/lib/public-cache";
import { MediathequePublicGrid } from "@/components/mediatheque/MediathequePublicGrid";
import type { PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

export async function MediathequePageAsync() {
  let items: PublicMediathequeItem[] = [];

  try {
    items = await getPublishedMediatheques();
  } catch {
    items = [];
  }

  return <MediathequePublicGrid items={items} compact />;
}

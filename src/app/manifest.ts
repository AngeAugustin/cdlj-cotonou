import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_FULL, SITE_THEME_COLOR } from "@/config/seo";
import { absoluteUrl } from "@/lib/site-url";
import { CDLJ_LOGO_SRC } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME_FULL,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: SITE_THEME_COLOR,
    lang: "fr",
    dir: "ltr",
    orientation: "portrait-primary",
    categories: ["education", "lifestyle"],
    icons: [
      {
        src: absoluteUrl(CDLJ_LOGO_SRC),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: absoluteUrl("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

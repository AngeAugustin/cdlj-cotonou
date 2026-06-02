import type { Metadata } from "next";
import { SITE_ICONS } from "@/config/site-icons";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_CONTACT,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_NAME_FULL,
  SITE_TAGLINE,
} from "@/config/seo";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

/** Extrait le jeton seul, même si la variable contient le préfixe google-site-verification=. */
function normalizeGoogleVerification(raw?: string): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  return value.replace(/^google-site-verification=/i, "");
}

type PageMetadataOptions = {
  /** Titre affiché (le template racine ajoute « | CDLJ Cotonou »). */
  title: string;
  description: string;
  /** Chemin relatif, ex. `/about`. */
  path: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  keywords?: string[];
};

/** Tronque une description à ~160 caractères pour les snippets SERP. */
export function truncateDescription(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

/** Strip HTML basique pour extraire un extrait texte depuis le corps d'un article. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function createPageMetadata({
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  noIndex = false,
  publishedTime,
  modifiedTime,
  authors,
  section,
  keywords,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const image = ogImage || DEFAULT_OG_IMAGE;
  const desc = truncateDescription(description);
  const mergedKeywords = keywords ?? [...SITE_KEYWORDS];

  return {
    title,
    description: desc,
    keywords: mergedKeywords,
    authors: authors?.map((name) => ({ name })),
    creator: SITE_NAME_FULL,
    publisher: SITE_NAME_FULL,
    category: "Religion & Spiritualité",
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    alternates: { canonical: url },
    openGraph: {
      type: ogType,
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      ...(image && {
        images: [{ url: image.startsWith("http") ? image : absoluteUrl(image), alt: title }],
      }),
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
      ...(section && { section }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      ...(image && {
        images: [image.startsWith("http") ? image : absoluteUrl(image)],
      }),
    },
  };
}

/** Metadata globale du site (layout racine). */
export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const googleVerification = normalizeGoogleVerification(
    process.env.GOOGLE_SITE_VERIFICATION
  );

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — ${SITE_NAME_FULL}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [...SITE_KEYWORDS],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME_FULL, url: siteUrl }],
    creator: SITE_NAME_FULL,
    publisher: SITE_NAME_FULL,
    category: "Religion & Spiritualité",
    ...(googleVerification && {
      verification: { google: googleVerification },
    }),
    formatDetection: {
      email: true,
      address: true,
      telephone: true,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: absoluteUrl(DEFAULT_OG_IMAGE),
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: `${SITE_NAME_FULL} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
    alternates: {
      canonical: siteUrl,
    },
    icons: {
      icon: [
        { url: SITE_ICONS.favicon, sizes: "48x48", type: "image/png" },
        { url: SITE_ICONS.icon96, sizes: "96x96", type: "image/png" },
        { url: SITE_ICONS.icon192, sizes: "192x192", type: "image/png" },
        { url: SITE_ICONS.icon512, sizes: "512x512", type: "image/png" },
      ],
      shortcut: SITE_ICONS.favicon,
      apple: [{ url: SITE_ICONS.appleTouch, sizes: "192x192", type: "image/png" }],
    },
    other: {
      "contact:email": SITE_CONTACT.email,
      "contact:phone_number": SITE_CONTACT.phone,
    },
  };
}

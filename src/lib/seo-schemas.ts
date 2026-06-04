import { FAQ_ITEMS } from "@/config/faq-data";
import { SITE_ICONS } from "@/config/site-icons";
import { SITE_NAV_SEO } from "@/config/site-navigation-seo";
import {
  PARENT_ORG,
  SITE_CONTACT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_FULL,
  SITE_SOCIAL,
  SITE_TAGLINE,
} from "@/config/seo";
import { absoluteUrl } from "@/lib/site-url";

const ORG_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME_FULL,
    alternateName: SITE_NAME,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_ICONS.logo),
      width: 512,
      height: 512,
    },
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    parentOrganization: {
      "@type": "Organization",
      name: PARENT_ORG,
    },
    email: SITE_CONTACT.email,
    telephone: SITE_CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONTACT.address.streetAddress,
      addressLocality: SITE_CONTACT.address.addressLocality,
      addressCountry: SITE_CONTACT.address.addressCountry,
    },
    sameAs: [SITE_SOCIAL.facebook, SITE_SOCIAL.tiktok],
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Archidiocèse de Cotonou",
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: SITE_NAME_FULL,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "fr-BJ",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/news")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Aide Google à identifier les pages principales (sitelinks potentiels). */
export function siteNavigationSchema() {
  return SITE_NAV_SEO.map((item) => ({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: item.name,
    description: item.description,
    url: absoluteUrl(item.href),
  }));
}

export function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  section?: string;
}) {
  const url = absoluteUrl(options.path);
  const image = options.image?.startsWith("http")
    ? options.image
    : options.image
      ? absoluteUrl(options.image)
      : absoluteUrl(SITE_ICONS.logo);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [image],
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    author: {
      "@type": "Person",
      name: options.author,
    },
    publisher: { "@id": ORG_ID },
    ...(options.section && { articleSection: options.section }),
    inLanguage: "fr-BJ",
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function placeSchema(options: {
  name: string;
  description: string;
  path: string;
  address: string;
  latitude: number;
  longitude: number;
  zone: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    address: {
      "@type": "PostalAddress",
      streetAddress: options.address,
      addressLocality: options.zone,
      addressCountry: "BJ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: options.latitude,
      longitude: options.longitude,
    },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: "Archidiocèse de Cotonou",
    },
  };
}

export function collectionPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "fr-BJ",
  };
}

/** Page statique (accueil, à propos, forums…). */
export function webPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  const url = absoluteUrl(options.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "fr-BJ",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function aboutPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  const url = absoluteUrl(options.path);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: options.name,
    description: options.description,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "fr-BJ",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

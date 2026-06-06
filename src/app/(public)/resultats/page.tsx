import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo-schemas";
import { ResultatsClient } from "./ResultatsClient";

const seo = PAGE_SEO.resultats;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/resultats",
  keywords: [...seo.keywords],
});

export default function ResultatsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Résultats", path: "/resultats" },
          ]),
          webPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/resultats",
          }),
        ]}
      />
      <ResultatsClient />
    </>
  );
}

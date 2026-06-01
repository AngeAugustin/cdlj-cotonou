import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Scanner une carte lecteur",
  description: "Outil interne de vérification de présence pour les activités CDLJ.",
  path: "/verifier",
  noIndex: true,
});

export default function VerifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Portail membre",
  description: "Connexion sécurisée à l'espace membre de la CDLJ pour les lecteurs, responsables et administrateurs.",
  path: "/auth/login",
  noIndex: true,
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NavigationProgress } from "@/components/NavigationProgress";
import { JsonLd } from "@/components/seo/JsonLd";
import { PUBLIC_NAV_LINKS } from "@/config/public-nav";
import { organizationSchema, websiteSchema } from "@/lib/seo-schemas";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <NavigationProgress />
      <Navbar links={PUBLIC_NAV_LINKS} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

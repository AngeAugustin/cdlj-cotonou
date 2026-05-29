import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PUBLIC_NAV_LINKS } from "@/config/public-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar links={PUBLIC_NAV_LINKS} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

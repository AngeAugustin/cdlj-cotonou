import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

const aptosFont = localFont({
  src: [
    {
      path: "../../public/Aptos/Aptos-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Aptos/Aptos-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aptos",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CDLJ WEBAPP",
  description: "Plateforme de gestion de la communauté diocésaine des lecteurs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={aptosFont.variable}>
      <body className={`${aptosFont.className} antialiased min-h-screen bg-slate-50 flex flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

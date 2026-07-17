import type { Metadata } from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Les Jumelles Immo",
  description: "Estimez votre bien et confiez votre projet immobilier aux Jumelles Immo.",
  icons: {
    icon: "/brand/les-jumelles-monogramme-noir.png",
    apple: "/brand/les-jumelles-monogramme-noir.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

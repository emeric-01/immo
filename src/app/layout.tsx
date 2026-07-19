import type { Metadata } from "next";
import { createSocialImageUrl } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const defaultSocialTitle = "Les Jumelles Immo | Agence immobilière locale";
const defaultSocialDescription = "Prix immobiliers locaux, estimation argumentée et accompagnement immobilier personnalisé.";
const defaultSocialImage = createSocialImageUrl({
  title: "L’immobilier, avec méthode et expertise",
  description: defaultSocialDescription,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Les Jumelles Immo | Agence immobilière locale",
  description: "Estimez votre bien et confiez votre projet immobilier aux Jumelles Immo.",
  applicationName: "Les Jumelles Immo",
  authors: [{ name: "Les Jumelles Immo", url: "/" }],
  creator: "Les Jumelles Immo",
  publisher: "Les Jumelles Immo",
  category: "Immobilier",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Les Jumelles Immo",
    title: defaultSocialTitle,
    description: defaultSocialDescription,
    url: "/",
    images: [{ url: defaultSocialImage, width: 1200, height: 630, alt: "Les Jumelles Immo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSocialTitle,
    description: defaultSocialDescription,
    images: [defaultSocialImage],
  },
  icons: {
    icon: [{ url: "/brand/favicon-jumelles-immo.svg", type: "image/svg+xml" }],
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

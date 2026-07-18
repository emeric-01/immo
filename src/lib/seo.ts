import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

export function createPageMetadata({ title, description, path, image = "/images/agence-jumelles-immo-hero.webp", noIndex = false }: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false, noarchive: true } : { index: true, follow: true },
    openGraph: { type: "website", locale: "fr_FR", siteName: "Les Jumelles Immo", title, description, url: path, images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

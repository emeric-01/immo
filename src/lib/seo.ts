import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

type SocialImageOptions = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function createSocialImageUrl({ title, description, eyebrow = "Les Jumelles Immo" }: SocialImageOptions) {
  const params = new URLSearchParams({ title, eyebrow });

  if (description) {
    params.set("description", description);
  }

  return `/api/og?${params.toString()}`;
}

export function createPageMetadata({ title, description, path, image, noIndex = false }: PageMetadataOptions): Metadata {
  const socialTitle = title.replace(/\s+\|\s+Les Jumelles Immo$/i, "");
  const socialImage = image || createSocialImageUrl({ title: socialTitle, description });
  const socialImages = image
    ? [{ url: socialImage, alt: socialTitle }]
    : [{ url: socialImage, width: 1200, height: 630, alt: socialTitle }];

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false, noarchive: true } : { index: true, follow: true },
    openGraph: { type: "website", locale: "fr_FR", siteName: "Les Jumelles Immo", title: socialTitle, description, url: path, images: socialImages },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [socialImage] },
  };
}

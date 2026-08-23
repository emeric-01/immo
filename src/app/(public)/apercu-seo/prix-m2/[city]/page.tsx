import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocalMarketCityBySlug } from "@/lib/cities";
import { CityPriceSeoPreview } from "../../../prix-immobilier/[city]/city-price-page-content";

type PreviewPageProps = {
  params: Promise<{ city: string }>;
};

export const metadata: Metadata = {
  title: "Aperçu SEO prix au m²",
  robots: { follow: false, index: false },
};

export default async function CityPriceSeoPreviewPage({ params }: PreviewPageProps) {
  const { city: citySlug } = await params;

  if (citySlug !== "aubagne" || !getLocalMarketCityBySlug(citySlug)) {
    notFound();
  }

  return <CityPriceSeoPreview citySlug={citySlug} />;
}

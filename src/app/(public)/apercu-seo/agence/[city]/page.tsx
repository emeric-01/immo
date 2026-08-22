import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocalMarketCityBySlug } from "@/lib/cities";
import { LocalAgencyCityPreview } from "../../../agence-immobiliere/[city]/local-agency-preview-content";

type PreviewPageProps = {
  params: Promise<{ city: string }>;
};

export const metadata: Metadata = {
  title: "Aperçu SEO agence locale",
  robots: { follow: false, index: false },
};

export default async function AgencySeoPreviewPage({ params }: PreviewPageProps) {
  const { city: citySlug } = await params;
  if (!getLocalMarketCityBySlug(citySlug)) notFound();
  return <LocalAgencyCityPreview citySlug={citySlug} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocalMarketCityBySlug, localMarketCities } from "@/lib/cities";
import { createPageMetadata } from "@/lib/seo";
import { CityEstimationPage } from "../aubagne/CityEstimationPage";

type EstimationCityPageProps = {
  params: Promise<{ city: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return localMarketCities
    .filter((city) => city.slug !== "aubagne")
    .map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: EstimationCityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getLocalMarketCityBySlug(citySlug);

  if (!city) return { robots: { index: false, follow: false } };

  return createPageMetadata({
    title: `Estimation immobilière à ${city.name} | Maison et appartement`,
    description: `Estimation immobilière à ${city.name} pour une maison ou un appartement : prix au m², ventes récentes, secteurs et première estimation gratuite.`,
    path: `/estimation-immobiliere/${city.slug}`,
  });
}

export default async function EstimationCityPage({ params }: EstimationCityPageProps) {
  const { city: citySlug } = await params;
  const city = getLocalMarketCityBySlug(citySlug);

  if (!city) notFound();

  return <CityEstimationPage citySlug={city.slug} />;
}

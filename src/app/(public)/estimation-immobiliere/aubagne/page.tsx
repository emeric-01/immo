import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { CityEstimationPage } from "./CityEstimationPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Estimation immobilière à Aubagne | Maison et appartement",
  description: "Estimation immobilière à Aubagne pour une maison ou un appartement : prix au m², ventes récentes, quartiers et première estimation gratuite.",
  path: "/estimation-immobiliere/aubagne",
});

export default function AubagneEstimationPage() {
  return <CityEstimationPage citySlug="aubagne" />;
}

import type { Metadata } from "next";
import { CityEstimationPage } from "./CityEstimationPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estimation immobilière à Aubagne | Maison et appartement",
  description: "Estimation immobilière à Aubagne pour une maison ou un appartement : prix au m², ventes récentes, quartiers et première estimation gratuite.",
  alternates: { canonical: "/estimation-immobiliere/aubagne" },
  robots: { index: true, follow: true },
};

export default function AubagneEstimationPage() {
  return <CityEstimationPage citySlug="aubagne" />;
}

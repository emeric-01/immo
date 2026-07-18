import type { Metadata } from "next";
import { BuyerSearchConfirmation } from "@/components/buyer-search/wizard/BuyerSearchConfirmation";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Recherche enregistrée | Les Jumelles Immo", description: "Confirmation de dépôt de recherche immobilière.", path: "/recherche/confirmation", noIndex: true });

export default function RechercheConfirmationPage() {
  return <BuyerSearchConfirmation />;
}

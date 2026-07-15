import type { Metadata } from "next";
import { BuyerSearchConfirmation } from "@/components/buyer-search/wizard/BuyerSearchConfirmation";

export const metadata: Metadata = {
  title: "Recherche enregistrée | Les Jumelles Immo",
  description: "Confirmation de dépôt de recherche immobilière.",
};

export default function RechercheConfirmationPage() {
  return <BuyerSearchConfirmation />;
}

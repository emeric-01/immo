import type { Metadata } from "next";
import { BuyerSearchConfirmation } from "@/components/buyer-search/wizard/BuyerSearchConfirmation";

export const metadata: Metadata = {
  title: "Recherche enregistree | Les Jumelles Immo",
  description: "Confirmation de depot de recherche immobiliere.",
};

export default function RechercheConfirmationPage() {
  return <BuyerSearchConfirmation />;
}

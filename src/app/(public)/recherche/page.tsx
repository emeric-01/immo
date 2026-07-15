import type { Metadata } from "next";
import { BuyerSearchWizard } from "@/components/buyer-search/wizard/BuyerSearchWizard";

export const metadata: Metadata = {
  title: "Recherche immobilière | Les Jumelles Immo",
  description: "Déposez votre recherche immobilière auprès des Jumelles Immo.",
};

export default function RecherchePage() {
  return <BuyerSearchWizard />;
}

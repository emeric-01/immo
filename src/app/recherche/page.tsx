import type { Metadata } from "next";
import { BuyerSearchWizard } from "@/components/buyer-search/wizard/BuyerSearchWizard";

export const metadata: Metadata = {
  title: "Recherche immobiliere | Les Jumelles Immo",
  description: "Deposez votre recherche immobiliere aupres de Les Jumelles Immo.",
};

export default function RecherchePage() {
  return <BuyerSearchWizard />;
}

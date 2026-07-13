import type { Metadata } from "next";
import { BuyerSearchDesignSystemDemo } from "@/components/buyer-search/design-system-demo";

export const metadata: Metadata = {
  title: "Recherche acheteurs | Les Jumelles Immo",
  description:
    "Socle de composants pour le module de recherche acheteurs Les Jumelles Immo.",
};

export default function BuyerSearchPage() {
  return <BuyerSearchDesignSystemDemo />;
}

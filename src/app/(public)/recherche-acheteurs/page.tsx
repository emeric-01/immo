import type { Metadata } from "next";
import { BuyerSearchDesignSystemDemo } from "@/components/buyer-search/design-system-demo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Recherche acheteurs | Les Jumelles Immo", description: "Socle de composants du module de recherche acheteurs Les Jumelles Immo.", path: "/recherche-acheteurs", noIndex: true });

export default function BuyerSearchPage() {
  return <BuyerSearchDesignSystemDemo />;
}

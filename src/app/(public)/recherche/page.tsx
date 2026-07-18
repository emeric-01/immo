import type { Metadata } from "next";
import { BuyerSearchWizard } from "@/components/buyer-search/wizard/BuyerSearchWizard";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Recherche immobilière accompagnée | Les Jumelles Immo", description: "Déposez vos critères de recherche immobilière et bénéficiez d’un accompagnement personnalisé dans votre secteur.", path: "/recherche" });

export default function RecherchePage() {
  return <BuyerSearchWizard />;
}

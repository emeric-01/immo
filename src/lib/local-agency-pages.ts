export type LocalAgencyPage = {
  citySlug: string;
  eyebrow: string;
  heroTitle: string;
  heroIntro: string;
  heroImage: {
    src: string;
    alt: string;
  };
  interventionText: string;
  nearbySlugs: string[];
  localFactors: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

const localAgencyPages: Record<string, LocalAgencyPage> = {
  "la-ciotat": {
    citySlug: "la-ciotat",
    eyebrow: "Estimation et vente à La Ciotat",
    heroTitle: "Vendre avec une stratégie qui révèle vraiment votre bien.",
    heroIntro:
      "Nous nous déplaçons pour estimer votre bien, comprendre son environnement et construire une commercialisation adaptée au marché local.",
    heroImage: {
      src: "/images/local-agency/maison-piscine-mediterranee.jpg",
      alt: "Maison méditerranéenne avec jardin et piscine",
    },
    interventionText:
      "Nous intervenons à La Ciotat, sur le littoral, dans les quartiers résidentiels et les communes voisines.",
    nearbySlugs: ["cassis", "ceyreste", "saint-cyr-sur-mer", "cuges-les-pins"],
    localFactors: [
      {
        title: "Adresse et micro-secteur",
        description: "La proximité du littoral, du centre ou des accès change profondément la lecture d’un bien.",
      },
      {
        title: "Vue et luminosité",
        description: "L’orientation, les perspectives et la lumière naturelle participent directement à l’attractivité.",
      },
      {
        title: "Extérieur",
        description: "Terrasse, jardin et piscine demandent une comparaison locale réellement adaptée.",
      },
      {
        title: "Stationnement",
        description: "Garage, place privative ou facilité d’accès peuvent devenir des critères décisifs.",
      },
      {
        title: "État et distribution",
        description: "Volumes, circulation et travaux à prévoir influencent la perception comme le prix défendable.",
      },
      {
        title: "Potentiel urbanistique",
        description: "Agrandissement, division ou règles du PLU sont examinés avant de promettre une valeur supplémentaire.",
      },
    ],
    faqs: [
      {
        question: "Vous déplacez-vous pour réaliser l’estimation ?",
        answer:
          "Oui. La visite sur place est indispensable pour comprendre l’adresse, la lumière, les volumes, l’état du bien et son environnement immédiat.",
      },
      {
        question: "Comment déterminez-vous le prix de vente ?",
        answer:
          "Nous croisons les transactions observées, les biens comparables, la dynamique du micro-secteur et les caractéristiques propres du logement. La donnée sert de repère, puis l’analyse humaine affine la stratégie.",
      },
      {
        question: "Pouvez-vous valoriser le bien avant sa mise en vente ?",
        answer:
          "Oui. L’architecture intérieure, la présentation et une sélection raisonnée de travaux peuvent aider les acquéreurs à mieux percevoir le potentiel sans engager de dépenses inutiles.",
      },
      {
        question: "Intervenez-vous sans agence physique dans la ville ?",
        answer:
          "Oui. Nous intervenons directement à La Ciotat et dans les communes voisines. Nos rendez-vous sont organisés sur place afin de rester proches du bien et de son marché réel.",
      },
    ],
  },
};

export function getLocalAgencyPage(slug: string) {
  return localAgencyPages[slug] ?? null;
}

export function getLocalAgencyPageSlugs() {
  return Object.keys(localAgencyPages);
}

import { getCityBySlug, southCities, type City } from "@/lib/cities";

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
        question: "Vous déplacez-vous à La Ciotat pour réaliser l’estimation ?",
        answer:
          "Oui. Une estimation immobilière sérieuse commence par une visite du bien. À La Ciotat, deux logements de surface comparable peuvent présenter des valeurs différentes selon le micro-secteur, la vue, l’exposition, le calme, le stationnement, l’étage, la qualité des extérieurs ou la proximité du littoral et des commodités. Le déplacement nous permet aussi d’apprécier l’état général, la distribution des pièces et les éventuels travaux. Ces éléments de terrain complètent les données de marché et permettent de proposer un prix de vente argumenté, et non une simple moyenne au mètre carré.",
      },
      {
        question: "Comment déterminez-vous le prix de vente d’un bien à La Ciotat ?",
        answer:
          "Nous croisons plusieurs niveaux d’analyse : les transactions immobilières enregistrées, les références DVF disponibles, les biens comparables récemment proposés ou vendus, la dynamique du marché local et les caractéristiques précises de votre maison ou de votre appartement. Nous examinons ensuite ce qui distingue réellement le bien : adresse, environnement, vue, luminosité, extérieur, stationnement, état, qualité du plan et potentiel d’évolution. Les données fournissent un référentiel utile, mais elles ne remplacent ni la visite ni la connaissance des écarts entre les différents secteurs de La Ciotat. L’objectif est de défendre un prix cohérent avec le marché, sans sous-évaluation ni promesse irréaliste.",
      },
      {
        question: "Pourquoi le prix au m² ne suffit-il pas pour estimer une maison ou un appartement ?",
        answer:
          "Le prix moyen au mètre carré donne un ordre de grandeur, mais il ne raconte jamais toute l’histoire d’un bien. Pour un appartement, l’étage, l’ascenseur, la vue, la terrasse, le bruit, les charges ou la présence d’un stationnement peuvent faire varier l’attractivité. Pour une maison, la parcelle, l’orientation, la piscine, l’accès, l’état du bâti et les possibilités d’agrandissement doivent être étudiés. À La Ciotat, la valeur peut également évoluer rapidement d’une rue ou d’un environnement à l’autre. L’estimation doit donc replacer la moyenne communale dans le contexte réel du logement.",
      },
      {
        question: "Pouvez-vous valoriser le bien avant sa mise en vente ?",
        answer:
          "Oui. Avant de prévoir des travaux importants, nous identifions les actions qui peuvent améliorer la perception du bien : désencombrement, circulation plus fluide, harmonisation des couleurs, meilleure utilisation de la lumière, petites réparations ou mise en scène des volumes. Notre approche en architecture intérieure aide également à révéler des mètres carrés mal exploités et à présenter des pistes d’aménagement compréhensibles pour les acquéreurs. L’objectif n’est pas de transformer artificiellement le logement, mais de faciliter la projection et de concentrer le budget sur les améliorations réellement pertinentes pour la vente.",
      },
      {
        question: "Étudiez-vous le potentiel d’agrandissement ou de division d’un bien ?",
        answer:
          "Lorsque le bien et le projet s’y prêtent, nous pouvons intégrer une première lecture de son potentiel urbanistique. Une extension, une surélévation, une dépendance, un changement de destination ou une division parcellaire peuvent influencer la stratégie de vente, mais leur faisabilité ne doit jamais être supposée. Elle dépend notamment du PLU, de la zone, des accès, des réseaux, des servitudes et de la configuration de la parcelle. Cette analyse permet de distinguer un potentiel crédible d’une simple hypothèse et, si nécessaire, d’orienter le propriétaire vers les vérifications ou professionnels compétents avant toute communication aux acquéreurs.",
      },
      {
        question: "Quel délai faut-il prévoir pour vendre un bien immobilier à La Ciotat ?",
        answer:
          "Il n’existe pas de délai identique pour tous les biens. La rapidité d’une vente dépend du prix de départ, de la demande dans le secteur, de la typologie du logement, de son état, de sa présentation et de la qualité de la commercialisation. Un prix trop élevé peut réduire les demandes et fragiliser ensuite la négociation, tandis qu’un positionnement cohérent favorise des contacts plus qualifiés. Nous suivons les retours obtenus après la diffusion et les visites afin d’ajuster la stratégie si le marché envoie un signal clair. Le calendrier est donc piloté avec méthode, sans promettre une vente immédiate.",
      },
      {
        question: "Quels documents préparer avant une estimation ou une mise en vente ?",
        answer:
          "Pour préparer l’analyse, il est utile de réunir le titre de propriété, les plans disponibles, la taxe foncière, les diagnostics déjà réalisés et les informations concernant les travaux. Pour un appartement, les documents de copropriété, le montant des charges, les derniers procès-verbaux d’assemblée générale et les informations sur le stationnement sont également importants. Pour une maison, les autorisations d’urbanisme, factures de travaux, plans de parcelle et informations relatives à l’assainissement peuvent compléter le dossier. Tous les éléments ne sont pas indispensables dès le premier rendez-vous, mais un dossier clair sécurise ensuite la commercialisation.",
      },
      {
        question: "Intervenez-vous à La Ciotat sans agence physique ouverte dans la ville ?",
        answer:
          "Oui. Notre organisation repose sur des rendez-vous directement sur place, à La Ciotat et dans les communes voisines. Cette proximité terrain permet d’observer l’environnement du bien, les accès, le voisinage immédiat et les caractéristiques du secteur, qui sont essentiels pour l’estimation comme pour la présentation aux acquéreurs. Selon le projet et la zone, le suivi est assuré par un professionnel référent appliquant la méthode de l’agence. Vous bénéficiez ainsi d’un accompagnement coordonné, de l’estimation à la négociation, sans que la présence d’une vitrine physique locale soit nécessaire.",
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

function distanceBetweenCities(first: City, second: City) {
  const earthRadiusKm = 6_371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getNearestLocalAgencyCities(citySlug: string, limit = 4) {
  const currentCity = getCityBySlug(citySlug);
  if (!currentCity) return [];

  const publishedSlugs = new Set(getLocalAgencyPageSlugs());

  return southCities
    .filter(
      (candidate) =>
        candidate.slug !== citySlug &&
        publishedSlugs.has(candidate.slug) &&
        ["Bouches-du-Rhone", "Var"].includes(candidate.department),
    )
    .map((candidate) => ({
      city: candidate,
      distanceKm: distanceBetweenCities(currentCity, candidate),
    }))
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, limit)
    .map(({ city }) => city);
}

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
    heroTitle: "Vendre à La Ciotat avec une stratégie qui révèle vraiment votre bien.",
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
        question: "Quel accompagnement proposez-vous à La Ciotat ?",
        answer:
          "Nous vous accompagnons directement sur place, à La Ciotat et dans les communes voisines. Cette proximité terrain permet d’observer précisément l’environnement du bien, les accès, le voisinage immédiat et les caractéristiques du secteur, autant d’éléments essentiels pour l’estimation et la présentation aux acquéreurs. Un professionnel référent assure le suivi de votre projet avec la méthode Les Jumelles Immo, de l’estimation à la négociation. Vous bénéficiez ainsi d’un accompagnement personnalisé, coordonné et attentif à chaque étape.",
      },
    ],
  },
  aubagne: {
    citySlug: "aubagne",
    eyebrow: "Estimation et vente à Aubagne",
    heroTitle: "Vendre à Aubagne avec une stratégie adaptée à votre bien et à son secteur.",
    heroIntro:
      "Nous estimons votre maison ou appartement sur place, puis construisons une commercialisation cohérente avec le marché aubagnais et les attentes des acquéreurs.",
    heroImage: {
      src: "/images/local-agency/maison-contemporaine-jardin.jpg",
      alt: "Maison contemporaine avec jardin dans le pays d’Aubagne",
    },
    interventionText:
      "Nous intervenons à Aubagne, du centre-ville aux secteurs résidentiels, ainsi que dans les communes voisines du pays d’Aubagne.",
    nearbySlugs: ["gemenos", "roquevaire", "la-penne-sur-huveaune", "carnoux-en-provence"],
    localFactors: [
      {
        title: "Adresse et secteur",
        description: "Centre-ville, Beaumond, Tourtelle, Charrel ou Garlaban ne répondent pas aux mêmes niveaux de demande.",
      },
      {
        title: "Calme et exposition",
        description: "L’environnement, les nuisances, la lumière et les vues dégagées influencent directement l’attractivité.",
      },
      {
        title: "Terrain et extérieur",
        description: "Jardin, terrasse, piscine et usage réel de la parcelle doivent être comparés avec des biens similaires.",
      },
      {
        title: "Accès et stationnement",
        description: "Garage, places privatives et facilité d’accès comptent particulièrement dans les secteurs résidentiels.",
      },
      {
        title: "État et performance",
        description: "Travaux, distribution, qualité du bâti et performance énergétique modifient le prix défendable.",
      },
      {
        title: "Potentiel du bien",
        description: "Extension, dépendance, division ou réaménagement sont étudiés avec prudence au regard des règles applicables.",
      },
    ],
    faqs: [
      {
        question: "Réalisez-vous des estimations immobilières à Aubagne ?",
        answer:
          "Oui. Nous nous déplaçons à Aubagne pour visiter la maison ou l’appartement, comprendre son environnement immédiat et confronter ses caractéristiques aux ventes comparables. Cette analyse sur place complète les données DVF et les prix moyens afin de proposer un avis de valeur argumenté avant une éventuelle mise en vente.",
      },
      {
        question: "Comment estimez-vous une maison à Aubagne ?",
        answer:
          "Nous étudions l’adresse, la surface habitable, le terrain, les extérieurs, l’exposition, le stationnement, l’état du bâti et les travaux éventuels. La comparaison tient compte de maisons réellement similaires et du niveau de demande observé dans le secteur, qu’il s’agisse notamment de Beaumond, Tourtelle, Charrel, Camp Major, Saint-Mitre ou des abords du Garlaban.",
      },
      {
        question: "Quels critères influencent l’estimation d’un appartement à Aubagne ?",
        answer:
          "Pour un appartement, nous analysons la résidence, l’étage, l’ascenseur, la luminosité, l’agencement, les extérieurs, le stationnement, les charges, le DPE et les travaux de copropriété. Deux appartements de même surface peuvent ainsi présenter une valeur différente selon leur adresse et leurs prestations.",
      },
      {
        question: "Accompagnez-vous toute la vente immobilière à Aubagne ?",
        answer:
          "Oui. Après l’estimation, nous définissons le positionnement du bien, préparons sa présentation, organisons sa diffusion et les visites, sélectionnons les acquéreurs et accompagnons la négociation. Le dossier est ensuite suivi du compromis jusqu’à la signature définitive.",
      },
      {
        question: "Pouvez-vous mettre en valeur un bien avant sa commercialisation ?",
        answer:
          "Notre double compétence en immobilier et architecture intérieure permet d’identifier les améliorations réellement utiles à la vente. Il peut s’agir de clarifier les volumes, faciliter la circulation, mieux utiliser la lumière ou présenter un potentiel d’aménagement, sans engager de dépenses disproportionnées ni masquer l’état réel du bien.",
      },
      {
        question: "Quels documents préparer pour vendre à Aubagne ?",
        answer:
          "Le titre de propriété, les diagnostics disponibles, les plans, la taxe foncière et les factures de travaux constituent une première base. Pour un appartement, les documents de copropriété sont nécessaires ; pour une maison, les autorisations d’urbanisme, informations d’assainissement et plans de parcelle peuvent également sécuriser la commercialisation.",
      },
    ],
  },
};

const localPageCities = southCities.filter((city) =>
  ["Bouches-du-Rhone", "Var"].includes(city.department),
);

const coastalCitySlugs = new Set([
  "bandol",
  "cassis",
  "ceyreste",
  "hyeres",
  "la-ciotat",
  "la-seyne-sur-mer",
  "marseille",
  "sanary-sur-mer",
  "saint-cyr-sur-mer",
  "six-fours-les-plages",
  "toulon",
]);

function createGenericLocalAgencyPage(city: City): LocalAgencyPage {
  const coastal = coastalCitySlugs.has(city.slug);

  return {
    citySlug: city.slug,
    eyebrow: `Estimation et vente à ${city.name}`,
    heroTitle: `Vendre à ${city.name} avec une stratégie adaptée à votre bien.`,
    heroIntro: `Nous nous déplaçons à ${city.name} pour estimer votre maison ou appartement, comprendre son environnement et préparer une commercialisation cohérente avec le marché local.`,
    heroImage: coastal
      ? {
          src: "/images/local-agency/maison-piscine-mediterranee.jpg",
          alt: `Maison méditerranéenne représentative du marché immobilier à ${city.name}`,
        }
      : {
          src: "/images/local-agency/maison-contemporaine-jardin.jpg",
          alt: `Maison avec jardin représentative du marché immobilier à ${city.name}`,
        },
    interventionText: `Nous intervenons à ${city.name}, dans ses différents secteurs résidentiels et dans les communes voisines.`,
    nearbySlugs: city.nearbySlugs,
    localFactors: [
      {
        title: "Adresse et micro-secteur",
        description: `À ${city.name}, la rue, l’environnement immédiat et la proximité des services influencent la valeur.`,
      },
      {
        title: "Vue et luminosité",
        description: "L’orientation, les perspectives, le vis-à-vis et la lumière naturelle modifient l’attractivité.",
      },
      {
        title: "Extérieur",
        description: "Balcon, terrasse, jardin, piscine et usage réel des espaces extérieurs doivent être comparés localement.",
      },
      {
        title: "Accès et stationnement",
        description: "Garage, place privative, transports et facilité d’accès peuvent devenir des critères décisifs.",
      },
      {
        title: "État et distribution",
        description: "Travaux, performance énergétique, volumes et circulation influencent le prix défendable.",
      },
      {
        title: "Potentiel urbanistique",
        description: "Extension, dépendance, division ou réaménagement sont étudiés au regard des règles applicables.",
      },
    ],
    faqs: [
      {
        question: `Vous déplacez-vous à ${city.name} pour réaliser une estimation ?`,
        answer: `Oui. Nous visitons le bien à ${city.name} afin d’analyser son état, son environnement, ses prestations et les éventuels travaux. Cette lecture de terrain complète les transactions disponibles et les prix moyens pour établir un avis de valeur argumenté.`,
      },
      {
        question: `Comment déterminez-vous le prix de vente à ${city.name} ?`,
        answer: `Nous croisons les ventes récentes, les références DVF, les biens comparables et la dynamique du marché à ${city.name}. L’adresse, la typologie, l’état, les extérieurs, le stationnement et les qualités propres au logement permettent ensuite d’ajuster le positionnement.`,
      },
      {
        question: `Estimez-vous les maisons et les appartements à ${city.name} ?`,
        answer: `Oui. Une maison est notamment étudiée selon son terrain, ses extérieurs, ses accès et son potentiel. Pour un appartement, nous intégrons la résidence, l’étage, l’ascenseur, les charges, les extérieurs et le stationnement.`,
      },
      {
        question: `Accompagnez-vous toute la vente immobilière à ${city.name} ?`,
        answer: `Oui. Nous préparons la stratégie, la présentation et la diffusion du bien, organisons les visites, sélectionnons les acquéreurs et accompagnons la négociation puis le dossier jusqu’à la signature définitive.`,
      },
      {
        question: "Pouvez-vous valoriser le bien avant sa mise en vente ?",
        answer: "Notre compétence en architecture intérieure permet d’identifier les améliorations utiles, de révéler les volumes et de faciliter la projection des acquéreurs sans engager de dépenses disproportionnées.",
      },
      {
        question: `Quels documents préparer pour vendre un bien à ${city.name} ?`,
        answer: "Le titre de propriété, les diagnostics, les plans, la taxe foncière et les factures de travaux constituent une première base. Les documents de copropriété ou les autorisations d’urbanisme complètent ensuite le dossier selon le type de bien.",
      },
    ],
  };
}

export function getLocalAgencyPage(slug: string) {
  const configuredPage = localAgencyPages[slug];
  if (configuredPage) return configuredPage;

  const city = localPageCities.find((candidate) => candidate.slug === slug);
  return city ? createGenericLocalAgencyPage(city) : null;
}

export function getLocalAgencyPageSlugs() {
  return localPageCities.map((city) => city.slug);
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

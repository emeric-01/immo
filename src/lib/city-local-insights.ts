import type { City } from "./cities";
import type { CityMarketData } from "./city-market-data";
import type { InseeDistributionItem, InseeHousingProfile } from "./insee-housing";

export type CityLocalMarketInsight = {
  population: number;
  populationChange?: number;
  ownerShare?: number;
  dominantHousing?: {
    label: "maisons" | "appartements";
    share: number;
  };
  secondaryHomeShare?: number;
  vacantHomeShare?: number;
  age65PlusShare?: number;
  summary: string;
  signals: Array<{
    title: string;
    description: string;
  }>;
};

function sum(items: InseeDistributionItem[]) {
  return items.reduce((total, item) => total + item.value, 0);
}

function share(items: InseeDistributionItem[], labelFragment: string) {
  const total = sum(items);
  const item = items.find((candidate) =>
    candidate.label.toLocaleLowerCase("fr-FR").includes(labelFragment),
  );
  return total > 0 && item ? Number(((item.value / total) * 100).toFixed(1)) : undefined;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function populationSentence(city: City, population: number, change?: number) {
  const formattedPopulation = population.toLocaleString("fr-FR");
  if (change === undefined) {
    return `${city.name} compte ${formattedPopulation} habitants selon les derniers chiffres publiés par l’INSEE.`;
  }
  if (change > 1) {
    return `${city.name} compte ${formattedPopulation} habitants selon les derniers chiffres publiés par l’INSEE, soit une progression de ${formatPercent(change)} entre 2017 et 2023.`;
  }
  if (change < -1) {
    return `${city.name} compte ${formattedPopulation} habitants selon les derniers chiffres publiés par l’INSEE, soit un recul de ${formatPercent(Math.abs(change))} entre 2017 et 2023.`;
  }
  return `${city.name} compte ${formattedPopulation} habitants selon les derniers chiffres publiés par l’INSEE, et sa population est restée globalement stable entre 2017 et 2023.`;
}

export function createCityLocalMarketInsight(
  city: City,
  market: CityMarketData | null,
  profile: InseeHousingProfile | null,
): CityLocalMarketInsight | null {
  const demographics = profile?.demographics;
  if (!profile || !demographics?.population) return null;

  const houseShare = share(profile.housingTypes, "maison");
  const apartmentShare = share(profile.housingTypes, "appartement");
  const ownerShare = share(profile.tenure, "propriétaire");
  const secondaryHomeShare = share(profile.occupancy, "secondaire");
  const vacantHomeShare = share(profile.occupancy, "vacant");
  const dominantHousing = houseShare !== undefined && apartmentShare !== undefined
    ? houseShare >= apartmentShare
      ? { label: "maisons" as const, share: houseShare }
      : { label: "appartements" as const, share: apartmentShare }
    : undefined;

  const summaryParts = [populationSentence(
    city,
    demographics.population,
    demographics.change2017To2023Percent,
  )];
  if (dominantHousing) {
    summaryParts.push(
      `Le parc résidentiel est composé majoritairement de ${dominantHousing.label} (${formatPercent(dominantHousing.share)}).`,
    );
  }
  summaryParts.push(
    "Ces indicateurs décrivent le contexte communal : ils aident à choisir les bonnes comparaisons, mais ne déterminent jamais à eux seuls la valeur d’un logement.",
  );

  const signals: CityLocalMarketInsight["signals"] = [];
  if (dominantHousing && market) {
    const relevantPrice = dominantHousing.label === "maisons"
      ? market.house.averagePricePerM2
      : market.apartment.averagePricePerM2;
    signals.push({
      title: `Un parc dominé par les ${dominantHousing.label}`,
      description: `${formatPercent(dominantHousing.share)} du parc correspond à cette typologie. Son repère de marché s’établit autour de ${Math.round(relevantPrice).toLocaleString("fr-FR")} €/m², à confronter à la surface, à l’état et au micro-secteur du bien.`,
    });
  }

  if (secondaryHomeShare !== undefined && secondaryHomeShare >= 15) {
    signals.push({
      title: "Une part significative de résidences secondaires",
      description: `${formatPercent(secondaryHomeShare)} des logements relèvent des résidences secondaires ou occasionnelles. Ce profil justifie d’analyser séparément les biens destinés à l’usage permanent et ceux répondant à une logique de villégiature.`,
    });
  } else if (vacantHomeShare !== undefined && vacantHomeShare >= 8) {
    signals.push({
      title: "Une vacance à intégrer à la lecture locale",
      description: `${formatPercent(vacantHomeShare)} des logements sont recensés comme vacants. Ce taux ne préjuge pas de l’état des biens, mais invite à étudier précisément l’offre réellement habitable et disponible.`,
    });
  } else if (ownerShare !== undefined) {
    signals.push({
      title: "Le statut d’occupation du parc",
      description: `${formatPercent(ownerShare)} des résidences principales sont occupées par leurs propriétaires. Cet indicateur éclaire la structure du parc sans constituer, à lui seul, un facteur de prix.`,
    });
  }

  if (demographics.age65PlusShare !== undefined && demographics.age65PlusShare >= 24) {
    signals.push({
      title: "L’accessibilité mérite une lecture explicite",
      description: `Les 65 ans ou plus représentent ${formatPercent(demographics.age65PlusShare)} de la population. Pour l’estimation, l’ascenseur, le plain-pied, le stationnement et la proximité des services peuvent donc utilement être documentés.`,
    });
  } else if (demographics.under20Share !== undefined && demographics.under20Share >= 24) {
    signals.push({
      title: "Un profil démographique familial",
      description: `Les moins de 20 ans représentent ${formatPercent(demographics.under20Share)} de la population. Les surfaces, les pièces supplémentaires, les extérieurs et les accès aux services doivent être décrits précisément, sans présumer des attentes de chaque acquéreur.`,
    });
  }

  if (demographics.change2017To2023Percent !== undefined) {
    signals.push({
      title: demographics.change2017To2023Percent > 1
        ? "Une population en progression"
        : demographics.change2017To2023Percent < -1
          ? "Une évolution démographique à surveiller"
          : "Une population globalement stable",
      description: `L’évolution de ${formatPercent(demographics.change2017To2023Percent)} entre 2017 et 2023 fournit un contexte utile. Elle doit être croisée avec les transactions, le volume de logements et la typologie du bien, et non présentée comme la cause directe d’une variation de prix.`,
    });
  }

  return {
    population: demographics.population,
    populationChange: demographics.change2017To2023Percent,
    ownerShare,
    dominantHousing,
    secondaryHomeShare,
    vacantHomeShare,
    age65PlusShare: demographics.age65PlusShare,
    summary: summaryParts.join(" "),
    signals: signals.slice(0, 3),
  };
}

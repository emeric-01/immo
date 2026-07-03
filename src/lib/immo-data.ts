export type RealtyType = "apartment" | "house";

export type PropertyEstimationInput = {
  address: string;
  propertyType: RealtyType;
  surfaceM2: number;
  rooms: number;
  landAreaM2?: number;
  bathrooms?: number;
  constructionYear?: number;
  buildingLevels?: number;
  floor?: number;
  condition?: "new" | "good" | "refresh" | "renovate";
  dpe?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  hasOutdoorSpace?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasCellar?: boolean;
  hasPool?: boolean;
  hasNiceView?: boolean;
};

export type PropertyEstimation = {
  source: "mock" | "immo-data";
  lowPrice: number;
  medianPrice: number;
  highPrice: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  pricePerM2: number;
  addressLabel: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  marketSignals: string[];
  positiveFactors: string[];
  negativeFactors: string[];
};

type ImmoDataConfig = {
  baseUrl: string;
  apiKey: string;
};

type ImmoDataGeocodeResult = {
  geoLevel?: string;
  label?: string;
  center?: [number, number];
  addressId?: string;
  cityName?: string;
  postCode?: string[];
};

type ImmoDataValuationResponse = {
  mainValuation: number;
  upperValuation: number;
  lowerValuation: number;
  confidence: number;
};

function getImmoDataConfig(): ImmoDataConfig | null {
  const apiKey = process.env.IMMO_DATA_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    baseUrl: (process.env.IMMO_DATA_BASE_URL ?? "https://api.immo-data.fr").replace(
      /\/$/,
      "",
    ),
    apiKey,
  };
}

function toConfidenceLabel(score: number): PropertyEstimation["confidence"] {
  if (score >= 4) {
    return "high";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
}

function toImmoDataCondition(
  condition: PropertyEstimationInput["condition"],
): -1 | 0 | 1 | undefined {
  if (condition === "renovate") {
    return -1;
  }

  if (condition === "new" || condition === "good") {
    return 1;
  }

  if (condition === "refresh") {
    return 0;
  }

  return undefined;
}

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: boolean | number | string | undefined,
) {
  if (value !== undefined && value !== "") {
    params.set(key, String(value));
  }
}

async function fetchImmoData<T>(
  config: ImmoDataConfig,
  path: string,
  params: URLSearchParams,
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(`Immo Data ${path} failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

async function geocodeAddress(
  config: ImmoDataConfig,
  address: string,
): Promise<ImmoDataGeocodeResult> {
  const params = new URLSearchParams({
    q: address,
    geoLevel: "address",
    limit: "1",
  });
  const results = await fetchImmoData<ImmoDataGeocodeResult[]>(
    config,
    "/v1/geocode",
    params,
  );
  const result = results[0];

  if (!result?.center || result.center.length !== 2) {
    throw new Error(`No geocode result for address: ${address}`);
  }

  return result;
}

async function getValuation(
  config: ImmoDataConfig,
  input: PropertyEstimationInput,
  geocode: ImmoDataGeocodeResult,
): Promise<ImmoDataValuationResponse> {
  const [longitude, latitude] = geocode.center ?? [];
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    realtyType: input.propertyType,
    nbRooms: String(input.rooms),
    livingArea: String(input.surfaceM2),
  });

  appendOptionalParam(params, "condition", toImmoDataCondition(input.condition));
  appendOptionalParam(params, "bathrooms", input.bathrooms);
  appendOptionalParam(params, "constructionYear", input.constructionYear);
  appendOptionalParam(params, "dpe", input.dpe);
  appendOptionalParam(params, "cellar", input.hasCellar);
  appendOptionalParam(params, "niceView", input.hasNiceView);
  appendOptionalParam(params, "parking", input.hasParking);

  if (input.propertyType === "house") {
    appendOptionalParam(params, "landArea", input.landAreaM2);
    appendOptionalParam(params, "pool", input.hasPool);
  }

  if (input.propertyType === "apartment") {
    appendOptionalParam(params, "level", input.buildingLevels);
    appendOptionalParam(params, "floor", input.floor);
    appendOptionalParam(params, "elevator", input.hasElevator);
    appendOptionalParam(params, "patio", input.hasOutdoorSpace);
  }

  return fetchImmoData<ImmoDataValuationResponse>(
    config,
    "/v1/valuation",
    params,
  );
}

export function createMockEstimation(
  input: PropertyEstimationInput,
): PropertyEstimation {
  const basePricePerM2 = input.propertyType === "house" ? 4650 : 5200;
  const outdoorBonus = input.hasOutdoorSpace ? 280 : 0;
  const conditionAdjustment =
    input.condition === "renovate"
      ? -520
      : input.condition === "refresh"
        ? -180
        : input.condition === "new"
          ? 340
          : 0;

  const pricePerM2 = Math.max(
    2400,
    Math.round(basePricePerM2 + outdoorBonus + conditionAdjustment),
  );
  const medianPrice = Math.round(input.surfaceM2 * pricePerM2);
  const spread = input.surfaceM2 < 40 ? 0.12 : 0.08;

  return {
    source: "mock",
    lowPrice: Math.round(medianPrice * (1 - spread)),
    medianPrice,
    highPrice: Math.round(medianPrice * (1 + spread)),
    confidence: input.address && input.surfaceM2 > 20 ? "medium" : "low",
    confidenceScore: input.address && input.surfaceM2 > 20 ? 3 : 1,
    pricePerM2,
    addressLabel: input.address,
    marketSignals: [
      "Adresse qualifiee en mode demonstration",
      "Fourchette calculee avec donnees simulees",
      "Estimation a confirmer avec les acces Immo Data",
    ],
    positiveFactors: [
      input.hasOutdoorSpace ? "Exterieur valorisant" : "Adresse renseignee",
      input.condition === "new" || input.condition === "good"
        ? "Etat general rassurant"
        : "Potentiel de revalorisation",
    ],
    negativeFactors: [
      input.condition === "renovate"
        ? "Travaux a anticiper"
        : "Resultat mock tant que la cle API est absente",
    ],
  };
}

export async function createImmoDataEstimation(
  input: PropertyEstimationInput,
): Promise<PropertyEstimation> {
  const config = getImmoDataConfig();

  if (!config) {
    return createMockEstimation(input);
  }

  const geocode = await geocodeAddress(config, input.address);
  const valuation = await getValuation(config, input, geocode);
  const pricePerM2 = Math.round(valuation.mainValuation / input.surfaceM2);

  return {
    source: "immo-data",
    lowPrice: valuation.lowerValuation,
    medianPrice: valuation.mainValuation,
    highPrice: valuation.upperValuation,
    confidence: toConfidenceLabel(valuation.confidence),
    confidenceScore: valuation.confidence,
    pricePerM2,
    addressLabel: geocode.label ?? input.address,
    coordinates: geocode.center
      ? {
          longitude: geocode.center[0],
          latitude: geocode.center[1],
        }
      : undefined,
    marketSignals: [
      "Adresse geocodee par Immo Data",
      "Fourchette issue du modele de valorisation Immo Data",
      `Score de confiance ${valuation.confidence}/5`,
    ],
    positiveFactors: [
      input.hasOutdoorSpace ? "Exterieur valorisant" : "Localisation analysee",
      input.hasParking ? "Stationnement declare" : "Caracteristiques prises en compte",
    ],
    negativeFactors: [
      "Estimation indicative a confirmer par visite",
      "Les documents et l'etat reel du bien peuvent affiner la valeur",
    ],
  };
}

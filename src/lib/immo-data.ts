export type RealtyType = "apartment" | "house";

export type PropertyEstimationInput = {
  address: string;
  selectedAddress?: AddressSuggestion;
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
  market?: {
    sectorPricePerM2?: number;
    priceEvolution12Months?: number;
    priceHistory?: Array<{
      period: string;
      value: number;
    }>;
    saleDurationDays?: number;
    supplyLevel?: "Faible" | "Modere" | "Eleve";
    demandLevel?: "Faible" | "Bonne demande" | "Forte demande";
  };
  comparables: ComparableSale[];
  energy?: {
    dpeRating?: string;
    gesRating?: string;
    sampleSize?: number;
  };
};

export type ComparableSale = {
  id: string;
  label: string;
  propertyType: RealtyType;
  surfaceM2?: number;
  rooms?: number;
  price: number;
  pricePerM2?: number;
  distanceMeters?: number;
  soldAt?: string;
};

export type AddressSuggestion = {
  label: string;
  addressId?: string;
  inseeCode?: string;
  districtCode?: string;
  departmentCode?: string;
  cityName?: string;
  postCode?: string[];
  longitude: number;
  latitude: number;
};

export const MIN_ADDRESS_QUERY_LENGTH = 3;

type ImmoDataConfig = {
  baseUrl: string;
  apiKey: string;
};

type ImmoDataGeocodeResult = {
  geoLevel?: string;
  label?: string;
  center?: [number, number];
  addressId?: string;
  inseeCode?: string;
  districtCode?: string;
  departmentCode?: string;
  cityName?: string;
  postCode?: string[];
};

type ImmoDataValuationResponse = {
  mainValuation: number;
  upperValuation: number;
  lowerValuation: number;
  confidence: number;
};

type CurrentMetricResponse = {
  value: number | null;
};

type HistoryMetricResponse = {
  data?: Array<{
    period: string;
    value: number | null;
  }>;
};

type ImmoDataTransactionsResponse = {
  total: number;
  data?: ImmoDataTransaction[];
};

type ImmoDataTransaction = {
  txId?: string;
  txDate?: string;
  price?: number;
  squareMeterPrice?: number;
  realtyType?: RealtyType;
  attributes?: {
    livingArea?: number;
    rooms?: number;
  };
  lot?: Array<{
    location?: {
      address?: {
        cityName?: string;
        streetName?: string;
        streetNumber?: string;
      };
      geometry?: {
        coordinates?: [number, number];
      };
    };
    realty?: Array<{
      livingArea?: number;
      rooms?: number;
      realtyType?: RealtyType;
    }>;
  }>;
};

type ImmoDataDpesResponse = {
  total: number;
  data?: Array<{
    dpeRating?: string;
    gesRating?: string;
  }>;
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

function previousMonth(monthsAgo: number) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - monthsAgo);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function distanceMeters(
  from: { longitude: number; latitude: number },
  to?: [number, number],
) {
  if (!to) {
    return undefined;
  }

  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to[1] - from.latitude);
  const dLon = toRadians(to[0] - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toGeoScope(geocode: ImmoDataGeocodeResult) {
  if (geocode.districtCode) {
    return { code: geocode.districtCode, geoLevel: "district" };
  }

  if (geocode.inseeCode) {
    return { code: geocode.inseeCode, geoLevel: "city" };
  }

  if (geocode.departmentCode) {
    return { code: geocode.departmentCode, geoLevel: "department" };
  }

  return null;
}

async function optionalImmoData<T>(
  callback: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await callback();
  } catch (error) {
    console.warn(error);

    return undefined;
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

function toComparableSale(
  transaction: ImmoDataTransaction,
  index: number,
  coordinates?: { longitude: number; latitude: number },
): ComparableSale | null {
  if (!transaction.price) {
    return null;
  }

  const lot = transaction.lot?.[0];
  const lotRealty = lot?.realty?.[0];
  const address = lot?.location?.address;
  const surfaceM2 =
    transaction.attributes?.livingArea ?? lotRealty?.livingArea ?? undefined;
  const rooms = transaction.attributes?.rooms ?? lotRealty?.rooms ?? undefined;
  const propertyType =
    transaction.realtyType === "house" || transaction.realtyType === "apartment"
      ? transaction.realtyType
      : lotRealty?.realtyType;

  return {
    id: transaction.txId ?? `${transaction.price}-${index}`,
    label:
      address?.streetName ??
      address?.cityName ??
      (propertyType === "house" ? "Maison vendue" : "Appartement vendu"),
    propertyType: propertyType === "house" ? "house" : "apartment",
    surfaceM2,
    rooms,
    price: transaction.price,
    pricePerM2: transaction.squareMeterPrice,
    distanceMeters: coordinates
      ? distanceMeters(coordinates, lot?.location?.geometry?.coordinates)
      : undefined,
    soldAt: transaction.txDate,
  };
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

async function getMarketEnrichment(
  config: ImmoDataConfig,
  input: PropertyEstimationInput,
  geocode: ImmoDataGeocodeResult,
  coordinates?: { longitude: number; latitude: number },
): Promise<Pick<PropertyEstimation, "market" | "comparables" | "energy">> {
  const scope = toGeoScope(geocode);
  const marketParams = scope
    ? new URLSearchParams({
        code: scope.code,
        geoLevel: scope.geoLevel,
        marketType: "sales",
        realtyType: input.propertyType,
        metric: "sqm_price",
      })
    : null;
  const priceHistoryParams = marketParams
    ? new URLSearchParams({
        ...Object.fromEntries(marketParams),
        startDate: previousMonth(12),
        endDate: previousMonth(0),
      })
    : null;
  const saleDurationParams = scope
    ? new URLSearchParams({
        code: scope.code,
        geoLevel: scope.geoLevel,
        unit: "days",
      })
    : null;
  const transactionParams = new URLSearchParams({
    txType: "sales",
    realtyType: input.propertyType,
    sortBy: "date",
    sortOrder: "desc",
    size: "3",
  });
  const dpeParams = new URLSearchParams({
    realtyType: input.propertyType,
    size: "20",
    sortBy: "date",
    sortOrder: "desc",
  });
  const surfaceDelta = Math.max(10, Math.round(input.surfaceM2 * 0.25));

  appendOptionalParam(
    transactionParams,
    "livingAreaMin",
    Math.max(1, Math.round(input.surfaceM2 - surfaceDelta)),
  );
  appendOptionalParam(
    transactionParams,
    "livingAreaMax",
    Math.round(input.surfaceM2 + surfaceDelta),
  );
  appendOptionalParam(transactionParams, "minRoom", Math.max(1, input.rooms - 1));
  appendOptionalParam(transactionParams, "maxRoom", input.rooms + 1);

  appendOptionalParam(
    dpeParams,
    "livingAreaMin",
    Math.max(1, Math.round(input.surfaceM2 - surfaceDelta)),
  );
  appendOptionalParam(dpeParams, "livingAreaMax", Math.round(input.surfaceM2 + surfaceDelta));

  if (coordinates) {
    transactionParams.set("latitude", String(coordinates.latitude));
    transactionParams.set("longitude", String(coordinates.longitude));
    transactionParams.set("radius", "1500");
    dpeParams.set("latitude", String(coordinates.latitude));
    dpeParams.set("longitude", String(coordinates.longitude));
    dpeParams.set("radius", "1000");
  } else if (scope) {
    transactionParams.set("code", scope.code);
    transactionParams.set("geoLevel", scope.geoLevel === "department" ? "city" : scope.geoLevel);
    dpeParams.set("code", scope.code);
    dpeParams.set("geoLevel", scope.geoLevel === "department" ? "city" : scope.geoLevel);
  }

  const [currentPrice, priceHistory, saleDuration, transactions, dpes] =
    await Promise.all([
      marketParams
        ? optionalImmoData(() =>
            fetchImmoData<CurrentMetricResponse>(
              config,
              "/v1/market/price/current",
              marketParams,
            ),
          )
        : undefined,
      priceHistoryParams
        ? optionalImmoData(() =>
            fetchImmoData<HistoryMetricResponse>(
              config,
              "/v1/market/price/history",
              priceHistoryParams,
            ),
          )
        : undefined,
      saleDurationParams
        ? optionalImmoData(() =>
            fetchImmoData<CurrentMetricResponse>(
              config,
              "/v1/market/sale-duration/current",
              saleDurationParams,
            ),
          )
        : undefined,
      optionalImmoData(() =>
        fetchImmoData<ImmoDataTransactionsResponse>(
          config,
          "/v1/transactions",
          transactionParams,
        ),
      ),
      optionalImmoData(() =>
        fetchImmoData<ImmoDataDpesResponse>(config, "/v1/dpe", dpeParams),
      ),
    ]);

  const historyValues =
    priceHistory?.data
      ?.map((point) => point.value)
      .filter((value): value is number => typeof value === "number") ?? [];
  const priceHistoryPoints =
    priceHistory?.data
      ?.filter(
        (point): point is { period: string; value: number } =>
          typeof point.value === "number",
      )
      .slice(-12) ?? [];
  const firstHistoryValue = historyValues[0];
  const lastHistoryValue = historyValues[historyValues.length - 1];
  const priceEvolution12Months =
    firstHistoryValue && lastHistoryValue
      ? Number((((lastHistoryValue - firstHistoryValue) / firstHistoryValue) * 100).toFixed(1))
      : undefined;
  const saleDurationDays =
    typeof saleDuration?.value === "number" ? Math.round(saleDuration.value) : undefined;
  const supplyLevel =
    saleDurationDays === undefined
      ? undefined
      : saleDurationDays < 55
        ? "Faible"
        : saleDurationDays < 95
          ? "Modere"
          : "Eleve";
  const demandLevel =
    saleDurationDays === undefined
      ? undefined
      : saleDurationDays < 55
        ? "Forte demande"
        : saleDurationDays < 95
          ? "Bonne demande"
          : "Faible";

  return {
    market: {
      sectorPricePerM2: currentPrice?.value ?? undefined,
      priceEvolution12Months,
      priceHistory: priceHistoryPoints,
      saleDurationDays,
      supplyLevel,
      demandLevel,
    },
    comparables:
      transactions?.data
        ?.map((transaction, index) =>
          toComparableSale(transaction, index, coordinates),
        )
        .filter((sale): sale is ComparableSale => Boolean(sale)) ?? [],
    energy: {
      dpeRating: input.dpe || dpes?.data?.[0]?.dpeRating,
      gesRating: dpes?.data?.[0]?.gesRating,
      sampleSize: dpes?.total,
    },
  };
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
    addressLabel: input.selectedAddress?.label ?? input.address,
    coordinates: input.selectedAddress
      ? {
          longitude: input.selectedAddress.longitude,
          latitude: input.selectedAddress.latitude,
        }
      : undefined,
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
    market: {
      sectorPricePerM2: Math.round(pricePerM2 * 0.98),
      priceEvolution12Months: 3.2,
      priceHistory: [
        { period: "2025-03", value: Math.round(pricePerM2 * 0.94) },
        { period: "2025-05", value: Math.round(pricePerM2 * 0.95) },
        { period: "2025-07", value: Math.round(pricePerM2 * 0.96) },
        { period: "2025-09", value: Math.round(pricePerM2 * 0.98) },
        { period: "2025-11", value: Math.round(pricePerM2 * 0.99) },
        { period: "2026-01", value: Math.round(pricePerM2 * 1.01) },
        { period: "2026-03", value: Math.round(pricePerM2 * 1.02) },
      ],
      saleDurationDays: 47,
      supplyLevel: "Modere",
      demandLevel: "Bonne demande",
    },
    comparables: [
      {
        id: "mock-1",
        label: input.propertyType === "house" ? "Maison comparable" : "Appartement comparable",
        propertyType: input.propertyType,
        surfaceM2: Math.round(input.surfaceM2 * 0.96),
        rooms: input.rooms,
        price: Math.round(medianPrice * 0.96),
        pricePerM2: Math.round(pricePerM2 * 0.98),
        distanceMeters: 650,
        soldAt: "2026-02-01",
      },
      {
        id: "mock-2",
        label: input.propertyType === "house" ? "Maison vendue" : "Appartement vendu",
        propertyType: input.propertyType,
        surfaceM2: Math.round(input.surfaceM2 * 1.08),
        rooms: input.rooms + 1,
        price: Math.round(medianPrice * 1.08),
        pricePerM2: Math.round(pricePerM2 * 1.01),
        distanceMeters: 900,
        soldAt: "2025-11-01",
      },
      {
        id: "mock-3",
        label: input.propertyType === "house" ? "Maison proche" : "Appartement proche",
        propertyType: input.propertyType,
        surfaceM2: Math.round(input.surfaceM2 * 0.9),
        rooms: Math.max(1, input.rooms - 1),
        price: Math.round(medianPrice * 0.9),
        pricePerM2: Math.round(pricePerM2 * 0.99),
        distanceMeters: 1200,
        soldAt: "2025-09-01",
      },
    ],
    energy: {
      dpeRating: input.dpe || "D",
      gesRating: "B",
      sampleSize: 24,
    },
  };
}

export async function createImmoDataEstimation(
  input: PropertyEstimationInput,
): Promise<PropertyEstimation> {
  const config = getImmoDataConfig();

  if (!config) {
    return createMockEstimation(input);
  }

  let geocode = input.selectedAddress
    ? {
        label: input.selectedAddress.label,
        addressId: input.selectedAddress.addressId,
        inseeCode: input.selectedAddress.inseeCode,
        districtCode: input.selectedAddress.districtCode,
        departmentCode: input.selectedAddress.departmentCode,
        cityName: input.selectedAddress.cityName,
        postCode: input.selectedAddress.postCode,
        center: [
          input.selectedAddress.longitude,
          input.selectedAddress.latitude,
        ] as [number, number],
      }
    : await geocodeAddress(config, input.address);

  if (!toGeoScope(geocode)) {
    geocode = await geocodeAddress(config, input.address);
  }

  const valuation = await getValuation(config, input, geocode);
  const pricePerM2 = Math.round(valuation.mainValuation / input.surfaceM2);
  const coordinates = geocode.center
    ? {
        longitude: geocode.center[0],
        latitude: geocode.center[1],
      }
    : undefined;
  const enrichment = await getMarketEnrichment(config, input, geocode, coordinates);

  return {
    source: "immo-data",
    lowPrice: valuation.lowerValuation,
    medianPrice: valuation.mainValuation,
    highPrice: valuation.upperValuation,
    confidence: toConfidenceLabel(valuation.confidence),
    confidenceScore: valuation.confidence,
    pricePerM2,
    addressLabel: geocode.label ?? input.address,
    coordinates,
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
    ...enrichment,
  };
}

import type { City } from "./cities";

export type PropertyMarketStat = {
  averagePricePerM2: number;
  lowPricePerM2: number;
  highPricePerM2: number;
  confidenceScore: number;
  trend1Year: number;
};

export type CityPriceHistoryPoint = {
  period: string;
  apartment: number;
  house: number;
};

export type CityPriceZone = {
  id: string;
  name: string;
  pricePerM2: number;
  color: string;
  polygon: [number, number][];
};

export type CitySalePoint = {
  id: string;
  label: string;
  propertyType: "Appartement" | "Maison";
  rooms: number;
  surfaceM2: number;
  soldAt: string;
  longitude: number;
  latitude: number;
};

export type CityMarketData = {
  source: "immo-data" | "fallback";
  updatedAt: string;
  apartment: PropertyMarketStat;
  house: PropertyMarketStat;
  rent: {
    apartmentPerM2: number;
    housePerM2: number;
  };
  history: CityPriceHistoryPoint[];
  zones: CityPriceZone[];
  salePoints: CitySalePoint[];
  neighborhoods: Array<{
    name: string;
    pricePerM2: number;
  }>;
  expensiveStreets: Array<{
    name: string;
    pricePerM2: number;
  }>;
  affordableStreets: Array<{
    name: string;
    pricePerM2: number;
  }>;
  localInfo: {
    population: number;
    medianAge: number;
    density: number;
    areaKm2: number;
    homes: number;
    ownerShare: number;
  };
};

type ImmoDataConfig = {
  apiKey: string;
  baseUrl: string;
  revalidateSeconds: number;
};

type CurrentPriceResponse = {
  value: number | null;
};

type PriceHistoryResponse = {
  data?: Array<{
    period: string;
    value: number | null;
  }>;
};

type CityGeoResponse = {
  districtCodes?: string[];
};

type DistrictGeoResponse = {
  districtCode?: string;
  districtName?: string;
  boundaries?: {
    type?: string;
    coordinates?: unknown;
  };
};

type TransactionsResponse = {
  data?: TransactionResponse[];
};

type TransactionResponse = {
  txId?: string;
  txDate?: string;
  price?: number;
  squareMeterPrice?: number;
  realtyType?: "apartment" | "house";
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
      realtyType?: "apartment" | "house";
    }>;
  }>;
};

const aubagneMarketData: CityMarketData = {
  source: "fallback",
  updatedAt: "2026-07-01",
  apartment: {
    averagePricePerM2: 3751,
    lowPricePerM2: 2270,
    highPricePerM2: 5675,
    confidenceScore: 4,
    trend1Year: -1.4,
  },
  house: {
    averagePricePerM2: 3755,
    lowPricePerM2: 1759,
    highPricePerM2: 6233,
    confidenceScore: 3,
    trend1Year: -5,
  },
  rent: {
    apartmentPerM2: 16.2,
    housePerM2: 16.8,
  },
  history: [
    { period: "2015", apartment: 2940, house: 3090 },
    { period: "2016", apartment: 3020, house: 3190 },
    { period: "2017", apartment: 3150, house: 3270 },
    { period: "2018", apartment: 3180, house: 3320 },
    { period: "2019", apartment: 3370, house: 3510 },
    { period: "2020", apartment: 3440, house: 3560 },
    { period: "2021", apartment: 3610, house: 3710 },
    { period: "2022", apartment: 3890, house: 3980 },
    { period: "2023", apartment: 4070, house: 4160 },
    { period: "2024", apartment: 3720, house: 3840 },
    { period: "2025", apartment: 3810, house: 3890 },
    { period: "2026", apartment: 3751, house: 3755 },
  ],
  zones: [
    {
      id: "centre-ville",
      name: "Centre-ville",
      pricePerM2: 4107,
      color: "#3ecf5a",
      polygon: [
        [5.561, 43.295],
        [5.57, 43.302],
        [5.581, 43.297],
        [5.58, 43.289],
        [5.568, 43.286],
        [5.558, 43.29],
        [5.561, 43.295],
      ],
    },
    {
      id: "charrel",
      name: "Charrel",
      pricePerM2: 3536,
      color: "#f5ef55",
      polygon: [
        [5.545, 43.296],
        [5.558, 43.304],
        [5.57, 43.302],
        [5.561, 43.295],
        [5.548, 43.289],
        [5.542, 43.292],
        [5.545, 43.296],
      ],
    },
    {
      id: "paluds",
      name: "Les Paluds",
      pricePerM2: 3674,
      color: "#f5a15b",
      polygon: [
        [5.581, 43.297],
        [5.604, 43.302],
        [5.614, 43.292],
        [5.596, 43.283],
        [5.58, 43.289],
        [5.581, 43.297],
      ],
    },
    {
      id: "peripherie-est",
      name: "Peripherie est",
      pricePerM2: 2997,
      color: "#9be74d",
      polygon: [
        [5.596, 43.283],
        [5.614, 43.292],
        [5.629, 43.284],
        [5.619, 43.271],
        [5.6, 43.273],
        [5.596, 43.283],
      ],
    },
    {
      id: "secteur-prime",
      name: "Secteur premium",
      pricePerM2: 4908,
      color: "#ff5a52",
      polygon: [
        [5.548, 43.289],
        [5.568, 43.286],
        [5.558, 43.278],
        [5.538, 43.281],
        [5.548, 43.289],
      ],
    },
  ],
  salePoints: [
    {
      id: "sale-1",
      label: "Impasse des Capucines",
      propertyType: "Maison",
      rooms: 5,
      surfaceM2: 189,
      soldAt: "Juillet 2026",
      longitude: 5.565,
      latitude: 43.293,
    },
    {
      id: "sale-2",
      label: "Chemin des Espillieres",
      propertyType: "Appartement",
      rooms: 3,
      surfaceM2: 73,
      soldAt: "Juillet 2026",
      longitude: 5.574,
      latitude: 43.287,
    },
    {
      id: "sale-3",
      label: "Traverse Helene",
      propertyType: "Maison",
      rooms: 4,
      surfaceM2: 106,
      soldAt: "Juin 2026",
      longitude: 5.558,
      latitude: 43.299,
    },
    {
      id: "sale-4",
      label: "Impasse des Albizias",
      propertyType: "Maison",
      rooms: 5,
      surfaceM2: 170,
      soldAt: "Juin 2026",
      longitude: 5.589,
      latitude: 43.292,
    },
    {
      id: "sale-5",
      label: "Avenue du 21 Aout 1944",
      propertyType: "Appartement",
      rooms: 4,
      surfaceM2: 82,
      soldAt: "Mai 2026",
      longitude: 5.552,
      latitude: 43.286,
    },
    {
      id: "sale-6",
      label: "Rue de la Republique",
      propertyType: "Appartement",
      rooms: 2,
      surfaceM2: 48,
      soldAt: "Mai 2026",
      longitude: 5.571,
      latitude: 43.296,
    },
  ],
  neighborhoods: [
    { name: "Grand Quartier 01", pricePerM2: 2997 },
    { name: "Grand Quartier 02", pricePerM2: 3500 },
    { name: "Grand Quartier 03", pricePerM2: 3536 },
    { name: "Grand Quartier 04", pricePerM2: 3674 },
    { name: "Grand Quartier 05", pricePerM2: 3320 },
    { name: "Grand Quartier 06", pricePerM2: 3859 },
    { name: "Grand Quartier 07", pricePerM2: 4107 },
  ],
  expensiveStreets: [
    { name: "Chemin de la Croix", pricePerM2: 4908 },
    { name: "Chemin de la Durande", pricePerM2: 4908 },
    { name: "Chemin des Boyers", pricePerM2: 4908 },
    { name: "Lotissement Joinville", pricePerM2: 4908 },
    { name: "Lotissement l'Ouliveiredo", pricePerM2: 4908 },
  ],
  affordableStreets: [
    { name: "Rue Gachiou", pricePerM2: 2777 },
    { name: "Rue Rastegue", pricePerM2: 2787 },
    { name: "Rue Martinot", pricePerM2: 2792 },
    { name: "Rue de Guin", pricePerM2: 2795 },
    { name: "Rue Frederic Mistral", pricePerM2: 2796 },
  ],
  localInfo: {
    population: 47724,
    medianAge: 42,
    density: 871,
    areaKm2: 54.8,
    homes: 21025,
    ownerShare: 48.7,
  },
};

function getRevalidateSeconds() {
  const days = Number(process.env.CITY_MARKET_REVALIDATE_DAYS ?? "30");
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;

  return Math.round(safeDays * 24 * 60 * 60);
}

function getImmoDataConfig(): ImmoDataConfig | null {
  const apiKey = process.env.IMMO_DATA_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: (process.env.IMMO_DATA_BASE_URL ?? "https://api.immo-data.fr").replace(
      /\/$/,
      "",
    ),
    revalidateSeconds: getRevalidateSeconds(),
  };
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

async function fetchImmoData<T>(
  config: ImmoDataConfig,
  path: string,
  params?: URLSearchParams,
): Promise<T> {
  const query = params ? `?${params}` : "";
  const response = await fetch(`${config.baseUrl}${path}${query}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    next: {
      revalidate: config.revalidateSeconds,
    },
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(`Immo Data ${path} failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

async function optionalImmoData<T>(callback: () => Promise<T>) {
  try {
    return await callback();
  } catch (error) {
    console.warn(error);

    return undefined;
  }
}

function getTrend1Year(history: PriceHistoryResponse | undefined) {
  const values =
    history?.data
      ?.map((point) => point.value)
      .filter((value): value is number => typeof value === "number") ?? [];

  if (values.length < 2) {
    return 0;
  }

  const start = values[Math.max(0, values.length - 13)];
  const end = values[values.length - 1];

  if (!start || !end) {
    return 0;
  }

  return Number((((end - start) / start) * 100).toFixed(1));
}

function getRangeFromAverage(
  value: number | undefined,
  propertyType: "apartment" | "house",
  fallback: PropertyMarketStat,
) {
  if (!value) {
    return fallback;
  }

  const lowRatio = propertyType === "apartment" ? 0.61 : 0.47;
  const highRatio = propertyType === "apartment" ? 1.51 : 1.66;

  return {
    averagePricePerM2: Math.round(value),
    lowPricePerM2: Math.round(value * lowRatio),
    highPricePerM2: Math.round(value * highRatio),
    confidenceScore: fallback.confidenceScore,
    trend1Year: fallback.trend1Year,
  };
}

function hasPriceValue(response: CurrentPriceResponse | undefined) {
  return typeof response?.value === "number" && response.value > 0;
}

function toHistoryPoints(
  apartmentHistory: PriceHistoryResponse | undefined,
  houseHistory: PriceHistoryResponse | undefined,
  fallbackHistory: CityPriceHistoryPoint[],
) {
  const byPeriod = new Map<string, Partial<CityPriceHistoryPoint>>();

  apartmentHistory?.data?.forEach((point) => {
    if (typeof point.value === "number") {
      byPeriod.set(point.period, {
        ...byPeriod.get(point.period),
        period: point.period,
        apartment: Math.round(point.value),
      });
    }
  });

  houseHistory?.data?.forEach((point) => {
    if (typeof point.value === "number") {
      byPeriod.set(point.period, {
        ...byPeriod.get(point.period),
        period: point.period,
        house: Math.round(point.value),
      });
    }
  });

  const points = Array.from(byPeriod.values())
    .filter(
      (point): point is CityPriceHistoryPoint =>
        Boolean(point.period) &&
        typeof point.apartment === "number" &&
        typeof point.house === "number",
    )
    .sort((a, b) => a.period.localeCompare(b.period));

  if (points.length === 0) {
    return fallbackHistory;
  }

  return points.filter((_, index) => {
    if (points.length <= 12) {
      return true;
    }

    const stride = Math.ceil(points.length / 12);

    return index % stride === 0 || index === points.length - 1;
  });
}

function coordinatesFromDistrict(boundaries: DistrictGeoResponse["boundaries"]) {
  const firstRing =
    boundaries?.type === "Polygon" &&
    Array.isArray(boundaries.coordinates) &&
    Array.isArray(boundaries.coordinates[0])
      ? boundaries.coordinates[0]
      : null;

  if (!firstRing) {
    return null;
  }

  const coordinates = firstRing.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      typeof point[0] === "number" &&
      typeof point[1] === "number",
  );

  return coordinates.length >= 3 ? coordinates : null;
}

function priceColor(pricePerM2: number) {
  if (pricePerM2 < 3200) {
    return "#9be74d";
  }

  if (pricePerM2 < 3700) {
    return "#f5ef55";
  }

  if (pricePerM2 < 4300) {
    return "#f5a15b";
  }

  return "#ff5a52";
}

function getTransactionStreet(transaction: TransactionResponse) {
  return transaction.lot?.[0]?.location?.address?.streetName;
}

function toSalePoint(transaction: TransactionResponse, index: number): CitySalePoint | null {
  const coordinates = transaction.lot?.[0]?.location?.geometry?.coordinates;
  const lotRealty = transaction.lot?.[0]?.realty?.[0];
  const realtyType = transaction.realtyType ?? lotRealty?.realtyType;

  if (
    !coordinates ||
    typeof coordinates[0] !== "number" ||
    typeof coordinates[1] !== "number" ||
    (realtyType !== "apartment" && realtyType !== "house")
  ) {
    return null;
  }

  return {
    id: transaction.txId ?? `immo-data-sale-${index}`,
    label:
      getTransactionStreet(transaction) ??
      transaction.lot?.[0]?.location?.address?.cityName ??
      "Vente recente",
    propertyType: realtyType === "house" ? "Maison" : "Appartement",
    rooms: transaction.attributes?.rooms ?? lotRealty?.rooms ?? 0,
    surfaceM2: transaction.attributes?.livingArea ?? lotRealty?.livingArea ?? 0,
    soldAt: transaction.txDate ?? "Date NC",
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}

function streetsFromTransactions(
  transactions: TransactionResponse[] | undefined,
  order: "asc" | "desc",
) {
  const streets = new Map<string, number[]>();

  transactions?.forEach((transaction) => {
    const street = getTransactionStreet(transaction);

    if (!street || typeof transaction.squareMeterPrice !== "number") {
      return;
    }

    streets.set(street, [...(streets.get(street) ?? []), transaction.squareMeterPrice]);
  });

  const values = Array.from(streets.entries()).map(([name, prices]) => ({
    name,
    pricePerM2: Math.round(
      prices.reduce((total, price) => total + price, 0) / prices.length,
    ),
  }));

  return values
    .sort((a, b) =>
      order === "asc" ? a.pricePerM2 - b.pricePerM2 : b.pricePerM2 - a.pricePerM2,
    )
    .slice(0, 5);
}

async function getCityImmoDataMarket(
  config: ImmoDataConfig,
  city: City,
): Promise<CityMarketData> {
  const cityCode = city.inseeCode;
  const fallbackData = getStaticCityMarketData(city);
  const baseMarketParams = {
    code: cityCode,
    geoLevel: "city",
    marketType: "sales",
    metric: "sqm_price",
  };
  const currentApartmentParams = new URLSearchParams({
    ...baseMarketParams,
    realtyType: "apartment",
  });
  const currentHouseParams = new URLSearchParams({
    ...baseMarketParams,
    realtyType: "house",
  });
  const apartmentHistoryParams = new URLSearchParams({
    ...baseMarketParams,
    realtyType: "apartment",
    startDate: previousMonth(120),
    endDate: previousMonth(0),
  });
  const houseHistoryParams = new URLSearchParams({
    ...baseMarketParams,
    realtyType: "house",
    startDate: previousMonth(120),
    endDate: previousMonth(0),
  });
  const transactionsParams = new URLSearchParams({
    code: cityCode,
    geoLevel: "city",
    txType: "sales",
    realtyType: "house,apartment",
    sortBy: "date",
    sortOrder: "desc",
    size: "30",
  });

  const [
    currentApartment,
    currentHouse,
    apartmentHistory,
    houseHistory,
    transactions,
    cityGeo,
  ] = await Promise.all([
    optionalImmoData(() =>
      fetchImmoData<CurrentPriceResponse>(
        config,
        "/v1/market/price/current",
        currentApartmentParams,
      ),
    ),
    optionalImmoData(() =>
      fetchImmoData<CurrentPriceResponse>(
        config,
        "/v1/market/price/current",
        currentHouseParams,
      ),
    ),
    optionalImmoData(() =>
      fetchImmoData<PriceHistoryResponse>(
        config,
        "/v1/market/price/history",
        apartmentHistoryParams,
      ),
    ),
    optionalImmoData(() =>
      fetchImmoData<PriceHistoryResponse>(
        config,
        "/v1/market/price/history",
        houseHistoryParams,
      ),
    ),
    optionalImmoData(() =>
      fetchImmoData<TransactionsResponse>(config, "/v1/transactions", transactionsParams),
    ),
    optionalImmoData(() =>
      fetchImmoData<CityGeoResponse>(config, `/v1/geo/cities/${cityCode}`),
    ),
  ]);

  const districtCodes = cityGeo?.districtCodes?.slice(0, 7) ?? [];
  const districts = await Promise.all(
    districtCodes.map(async (districtCode) => {
      const [district, price] = await Promise.all([
        optionalImmoData(() =>
          fetchImmoData<DistrictGeoResponse>(
            config,
            `/v1/geo/districts/${districtCode}`,
          ),
        ),
        optionalImmoData(() =>
          fetchImmoData<CurrentPriceResponse>(
            config,
            "/v1/market/price/current",
            new URLSearchParams({
              code: districtCode,
              geoLevel: "district",
              marketType: "sales",
              realtyType: "apartment",
              metric: "sqm_price",
            }),
          ),
        ),
      ]);
      const polygon = coordinatesFromDistrict(district?.boundaries);
      const pricePerM2 = price?.value ?? undefined;

      if (!district?.districtCode || !polygon || !pricePerM2) {
        return null;
      }

      return {
        id: district.districtCode,
        name: district.districtName ?? `Quartier ${district.districtCode}`,
        pricePerM2: Math.round(pricePerM2),
        color: priceColor(pricePerM2),
        polygon,
      } satisfies CityPriceZone;
    }),
  );

  const zones = districts.filter((zone): zone is CityPriceZone => Boolean(zone));
  const salePointsFromTransactions =
    transactions?.data
      ?.map(toSalePoint)
      .filter((salePoint): salePoint is CitySalePoint => Boolean(salePoint))
      .slice(0, 12) ?? [];
  const salePoints =
    salePointsFromTransactions.length > 0
      ? salePointsFromTransactions
      : fallbackData.salePoints;
  const expensiveStreets =
    streetsFromTransactions(transactions?.data, "desc").length > 0
      ? streetsFromTransactions(transactions?.data, "desc")
      : fallbackData.expensiveStreets;
  const affordableStreets =
    streetsFromTransactions(transactions?.data, "asc").length > 0
      ? streetsFromTransactions(transactions?.data, "asc")
      : fallbackData.affordableStreets;

  const apartment = getRangeFromAverage(
    currentApartment?.value ?? undefined,
    "apartment",
    fallbackData.apartment,
  );
  const house = getRangeFromAverage(
    currentHouse?.value ?? undefined,
    "house",
    fallbackData.house,
  );
  const hasImmoDataPrice = hasPriceValue(currentApartment) || hasPriceValue(currentHouse);

  return {
    ...fallbackData,
    source: hasImmoDataPrice ? "immo-data" : "fallback",
    updatedAt: new Date().toISOString().slice(0, 10),
    apartment: {
      ...apartment,
      trend1Year: getTrend1Year(apartmentHistory) || fallbackData.apartment.trend1Year,
    },
    house: {
      ...house,
      trend1Year: getTrend1Year(houseHistory) || fallbackData.house.trend1Year,
    },
    history: toHistoryPoints(apartmentHistory, houseHistory, fallbackData.history),
    zones: zones.length > 0 ? zones : fallbackData.zones,
    salePoints,
    neighborhoods:
      zones.length > 0
        ? zones.map((zone) => ({
            name: zone.name,
            pricePerM2: zone.pricePerM2,
          }))
        : fallbackData.neighborhoods,
    expensiveStreets,
    affordableStreets,
  };
}

function shiftMarketData(city: City): CityMarketData {
  const seed = city.inseeCode
    .split("")
    .reduce((total, character) => total + Number(character), 0);
  const multiplier = 0.85 + (seed % 9) * 0.055;
  const averageApartment = Math.round(aubagneMarketData.apartment.averagePricePerM2 * multiplier);
  const averageHouse = Math.round(aubagneMarketData.house.averagePricePerM2 * (multiplier + 0.03));

  return {
    ...aubagneMarketData,
    apartment: {
      ...aubagneMarketData.apartment,
      averagePricePerM2: averageApartment,
      lowPricePerM2: Math.round(averageApartment * 0.61),
      highPricePerM2: Math.round(averageApartment * 1.51),
    },
    house: {
      ...aubagneMarketData.house,
      averagePricePerM2: averageHouse,
      lowPricePerM2: Math.round(averageHouse * 0.47),
      highPricePerM2: Math.round(averageHouse * 1.66),
    },
    history: aubagneMarketData.history.map((point) => ({
      period: point.period,
      apartment: Math.round(point.apartment * multiplier),
      house: Math.round(point.house * (multiplier + 0.03)),
    })),
    zones: aubagneMarketData.zones.map((zone, index) => ({
      ...zone,
      pricePerM2: Math.round(zone.pricePerM2 * multiplier),
      polygon: zone.polygon.map(([longitude, latitude]) => [
        longitude + (city.longitude - 5.5707),
        latitude + (city.latitude - 43.2928),
      ]),
      id: `${city.slug}-${index}`,
    })),
    salePoints: aubagneMarketData.salePoints.map((point, index) => ({
      ...point,
      id: `${city.slug}-sale-${index}`,
      longitude: point.longitude + (city.longitude - 5.5707),
      latitude: point.latitude + (city.latitude - 43.2928),
    })),
    neighborhoods: aubagneMarketData.neighborhoods.map((neighborhood) => ({
      ...neighborhood,
      pricePerM2: Math.round(neighborhood.pricePerM2 * multiplier),
    })),
    expensiveStreets: aubagneMarketData.expensiveStreets.map((street) => ({
      ...street,
      pricePerM2: Math.round(street.pricePerM2 * multiplier),
    })),
    affordableStreets: aubagneMarketData.affordableStreets.map((street) => ({
      ...street,
      pricePerM2: Math.round(street.pricePerM2 * multiplier),
    })),
  };
}

export function getStaticCityMarketData(city: City): CityMarketData {
  return shiftMarketData(city);
}

export async function getCityMarketData(city: City): Promise<CityMarketData> {
  const immoDataCitySlugs = new Set(["aubagne", "gemenos"]);

  if (!immoDataCitySlugs.has(city.slug)) {
    return getStaticCityMarketData(city);
  }

  const config = getImmoDataConfig();

  if (!config) {
    return getStaticCityMarketData(city);
  }

  const market = await optionalImmoData(() => getCityImmoDataMarket(config, city));

  return market ?? getStaticCityMarketData(city);
}

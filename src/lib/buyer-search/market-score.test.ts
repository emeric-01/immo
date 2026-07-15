import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeBuyerSearchMarket, calculateMarketCombinationScore } from "./market-score";
import type { BuyerSearchFormData } from "./types";

vi.mock("server-only", () => ({}));

const search: BuyerSearchFormData = {
  location: {
    cities: [
      {
        cityCode: "13005",
        latitude: 43.2928,
        longitude: 5.5707,
        name: "Aubagne",
        postalCode: "13400",
        radiusKm: 5,
      },
    ],
    customRadius: null,
    radiusKm: 5,
  },
  property: {
    idealBudget: 350000,
    maximumBudget: 400000,
    type: "house",
    types: ["house"],
  },
  characteristics: {
    minimumBathrooms: 1,
    minimumBedrooms: 2,
    minimumLivingArea: 100,
    minimumRooms: 4,
  },
  preferences: {
    additionalSpaces: [],
    buildingComfort: [],
    environment: [],
    houseEquipment: [],
    minimumLandArea: 350,
    outdoor: ["garden"],
    parking: ["garage"],
    works: [],
  },
  project: {
    currentSituation: "tenant",
    financingStatus: "budget_defined",
    purchaseTimeline: "m3",
  },
  priorities: [],
  contact: {
    consent: true,
    email: "test@example.com",
    firstName: "Test",
    lastName: "Client",
    phone: "0612345678",
    preferredChannel: "email",
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("buyer search market score", () => {
  it("combines affordability and comparable transaction volume", () => {
    expect(calculateMarketCombinationScore(4000, 4200, 14)).toBe(85);
    expect(calculateMarketCombinationScore(3000, 5000, 0)).toBe(25);
  });

  it("queries current prices and comparable transactions for the selected candidate", async () => {
    vi.stubEnv("IMMO_DATA_API_KEY", "test-token");
    vi.stubEnv("IMMO_DATA_BASE_URL", "https://api.example.test");

    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      void _init;
      const url = String(input);

      if (url.includes("/v1/market/price/current")) {
        return Response.json({ value: 4200 });
      }

      return Response.json({ total: 14 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeBuyerSearchMarket(search);

    expect(result).not.toBeNull();
    expect(result?.score).toBe(85);
    expect(result?.bestMatch).toMatchObject({
      cityName: "Aubagne",
      comparableTransactions: 14,
      gapPercent: -4.8,
      marketPricePerM2: 4200,
      propertyType: "house",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const transactionUrl = fetchMock.mock.calls
      .map(([input]) => String(input))
      .find((url) => url.includes("/v1/transactions"));
    const currentPriceCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/v1/market/price/current"),
    );

    expect(currentPriceCall?.[1]).toMatchObject({ next: { revalidate: 7_776_000 } });
    expect(transactionUrl).toContain("radius=5000");
    expect(transactionUrl).toContain("priceMax=400000");
    expect(transactionUrl).toContain("livingAreaMin=100");
    expect(transactionUrl).toContain("landAreaMin=350");
    expect(transactionUrl).toContain("minRoom=4");
  });

  it("only queries comparable transactions for the most affordable city", async () => {
    vi.stubEnv("IMMO_DATA_API_KEY", "test-token");
    vi.stubEnv("IMMO_DATA_BASE_URL", "https://api.example.test");

    const multiCitySearch: BuyerSearchFormData = {
      ...search,
      location: {
        ...search.location,
        cities: [
          ...search.location.cities,
          {
            cityCode: "13055",
            latitude: 43.2965,
            longitude: 5.3698,
            name: "Marseille",
            postalCode: "13001",
            radiusKm: 5,
          },
        ],
      },
    };
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/v1/transactions")) {
        return Response.json({ total: 14 });
      }

      return Response.json({ value: url.includes("code=13005") ? 4200 : 5600 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeBuyerSearchMarket(multiCitySearch);
    const transactionCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/v1/transactions"),
    );

    expect(result?.bestMatch.cityName).toBe("Aubagne");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(transactionCalls).toHaveLength(1);
    expect(String(transactionCalls[0][0])).toContain("latitude=43.2928");
  });
});

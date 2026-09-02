import { NextResponse } from "next/server";
import {
  createImmoDataEstimation,
  type PropertyEstimationInput,
} from "@/lib/immo-data";
import { getClientSession } from "@/lib/client-access/auth";
import { savePropertyEstimation } from "@/lib/client-access/estimations";
import {
  estimationHourlyIpLimit,
  isEstimationRateLimited,
  recordEstimationApiUsage,
} from "@/lib/estimation-api-alerts";
import { getCityByMarketIdentifier } from "@/lib/cities";
import { getPublishedCityMarketData } from "@/lib/published-city-market";
import { getCurrentAttribution, recordAttributedConversion } from "@/lib/attribution";

function isValidEstimationInput(
  input: Partial<PropertyEstimationInput>,
): input is PropertyEstimationInput {
  const address = typeof input.address === "string" ? input.address.trim() : "";
  const optionalNumbers: Array<[number | undefined, number, number]> = [
    [input.landAreaM2, 0, 10_000_000],
    [input.bathrooms, 0, 100],
    [input.constructionYear, 1000, 2200],
    [input.buildingLevels, 0, 300],
    [input.floor, -10, 300],
  ];
  const optionalBooleans = [
    input.hasOutdoorSpace,
    input.hasParking,
    input.hasElevator,
    input.hasCellar,
    input.hasPool,
    input.hasNiceView,
  ];
  const selectedAddress = input.selectedAddress;
  const selectedAddressIsValid = !selectedAddress || (
    typeof selectedAddress === "object"
    && typeof selectedAddress.label === "string"
    && selectedAddress.label.length <= 300
    && Number.isFinite(selectedAddress.latitude)
    && selectedAddress.latitude >= -90
    && selectedAddress.latitude <= 90
    && Number.isFinite(selectedAddress.longitude)
    && selectedAddress.longitude >= -180
    && selectedAddress.longitude <= 180
  );

  return address.length >= 3
    && address.length <= 250
    && (input.propertyType === "apartment" || input.propertyType === "house")
    && typeof input.surfaceM2 === "number"
    && Number.isFinite(input.surfaceM2)
    && input.surfaceM2 > 0
    && input.surfaceM2 <= 100_000
    && typeof input.rooms === "number"
    && Number.isInteger(input.rooms)
    && input.rooms > 0
    && input.rooms <= 100
    && optionalNumbers.every(([value, minimum, maximum]) => value === undefined || (
      typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
    ))
    && optionalBooleans.every((value) => value === undefined || typeof value === "boolean")
    && (input.condition === undefined || ["new", "good", "refresh", "renovate"].includes(input.condition))
    && (input.dpe === undefined || ["A", "B", "C", "D", "E", "F", "G"].includes(input.dpe))
    && selectedAddressIsValid;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Partial<PropertyEstimationInput>;

    if (!isValidEstimationInput(input)) {
      return NextResponse.json(
        {
          error:
            "Adresse, type de bien, surface et nombre de pieces sont obligatoires pour lancer l'estimation.",
        },
        { status: 400 },
      );
    }

    const usage = await recordEstimationApiUsage(request);

    if (isEstimationRateLimited(usage)) {
      return NextResponse.json(
        { error: `La limite de ${estimationHourlyIpLimit} estimations par heure est atteinte.` },
        { headers: { "Retry-After": "3600" }, status: 429 },
      );
    }

    const estimation = await createImmoDataEstimation(input);
    const city = getCityByMarketIdentifier({
      inseeCode: input.selectedAddress?.inseeCode,
      name: input.selectedAddress?.cityName,
    });
    const cityMarket = city ? await getPublishedCityMarketData(city) : null;
    const propertyMarket = cityMarket?.[input.propertyType];
    const enrichedEstimation = cityMarket
      ? {
          ...estimation,
          market: {
            ...estimation.market,
            cityPriceHistory: cityMarket.history,
            cityPriceHistoryCoverage: cityMarket.historyCoverage,
            cityPriceHistorySource: cityMarket.historySource,
            priceEvolution12Months:
              propertyMarket?.trend1Year ?? estimation.market?.priceEvolution12Months,
            sectorPricePerM2:
              propertyMarket?.averagePricePerM2 ?? estimation.market?.sectorPricePerM2,
            saleDurationDays:
              cityMarket.saleDurationDays ?? estimation.market?.saleDurationDays,
          },
        }
      : estimation;
    const session = await getClientSession();
    const attribution = await getCurrentAttribution();
    const estimationId = await savePropertyEstimation(
      session,
      input,
      enrichedEstimation,
      attribution,
    );
    await recordAttributedConversion(attribution, "estimation", estimationId, "/estimation");

    return NextResponse.json({
      ...enrichedEstimation,
      clientEstimationId: estimationId,
      savedToClientAccount: Boolean(session && estimationId),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "L'estimation est temporairement indisponible. Reessayez dans quelques instants.",
      },
      { status: 502 },
    );
  }
}

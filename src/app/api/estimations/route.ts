import { NextResponse } from "next/server";
import {
  createImmoDataEstimation,
  type PropertyEstimationInput,
} from "@/lib/immo-data";
import { getClientSession } from "@/lib/client-access/auth";
import { saveClientEstimation } from "@/lib/client-access/estimations";
import { recordEstimationApiUsage } from "@/lib/estimation-api-alerts";
import { getCityByMarketIdentifier } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";

function isValidEstimationInput(
  input: Partial<PropertyEstimationInput>,
): input is PropertyEstimationInput {
  return Boolean(
    input.address &&
      (input.propertyType === "apartment" || input.propertyType === "house") &&
      typeof input.surfaceM2 === "number" &&
      input.surfaceM2 > 0 &&
      typeof input.rooms === "number" &&
      input.rooms > 0,
  );
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

    await recordEstimationApiUsage(request);
    const estimation = await createImmoDataEstimation(input);
    const city = getCityByMarketIdentifier({
      inseeCode: input.selectedAddress?.inseeCode,
      name: input.selectedAddress?.cityName,
    });
    const cachedCityMarket = city ? await readCityMarketCache(city) : null;
    const propertyMarket = cachedCityMarket?.data[input.propertyType];
    const enrichedEstimation = cachedCityMarket
      ? {
          ...estimation,
          market: {
            ...estimation.market,
            cityPriceHistory: cachedCityMarket.data.history,
            priceEvolution12Months:
              propertyMarket?.trend1Year ?? estimation.market?.priceEvolution12Months,
            sectorPricePerM2:
              propertyMarket?.averagePricePerM2 ?? estimation.market?.sectorPricePerM2,
            saleDurationDays:
              cachedCityMarket.data.saleDurationDays ?? estimation.market?.saleDurationDays,
          },
        }
      : estimation;
    const session = await getClientSession();
    const estimationId = session
      ? await saveClientEstimation(session, input, enrichedEstimation)
      : null;

    return NextResponse.json({
      ...enrichedEstimation,
      clientEstimationId: estimationId,
      savedToClientAccount: Boolean(estimationId),
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

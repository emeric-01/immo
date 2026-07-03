import { NextResponse } from "next/server";
import {
  createImmoDataEstimation,
  type PropertyEstimationInput,
} from "@/lib/immo-data";

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

    const estimation = await createImmoDataEstimation(input);

    return NextResponse.json(estimation);
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

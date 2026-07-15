import { NextResponse } from "next/server";
import {
  createImmoDataEstimation,
  type PropertyEstimationInput,
} from "@/lib/immo-data";
import { getClientSession } from "@/lib/client-access/auth";
import { saveClientEstimation } from "@/lib/client-access/estimations";

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
    const session = await getClientSession();
    const estimationId = session
      ? await saveClientEstimation(session, input, estimation)
      : null;

    return NextResponse.json({
      ...estimation,
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

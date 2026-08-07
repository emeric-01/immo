import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { createStandaloneAdminEstimation } from "@/lib/admin/estimations";
import { hasAdminPermission } from "@/lib/admin/permissions";
import type { PropertyEstimationInput } from "@/lib/immo-data";

function isValid(input: Partial<PropertyEstimationInput>): input is PropertyEstimationInput {
  return Boolean(
    input.address &&
    (input.propertyType === "house" || input.propertyType === "apartment") &&
    Number(input.surfaceM2) > 0 &&
    Number(input.rooms) > 0,
  );
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const input = await request.json().catch(() => null) as Partial<PropertyEstimationInput> | null;
  if (!input || !isValid(input)) {
    return NextResponse.json({ error: "Informations d’estimation invalides." }, { status: 400 });
  }

  const result = await createStandaloneAdminEstimation(input, session);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 500 });

  return NextResponse.json({
    ...result.estimation,
    clientEstimationId: result.id,
    internal: true,
    savedToClientAccount: false,
  }, { status: 201 });
}

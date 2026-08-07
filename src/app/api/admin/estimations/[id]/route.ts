import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { updateAdminEstimationRange } from "@/lib/admin/estimations";
import { hasAdminPermission } from "@/lib/admin/permissions";

type RangePayload = {
  highPrice?: unknown;
  lowPrice?: unknown;
  medianPrice?: unknown;
};

function toPrice(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : NaN;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as RangePayload | null;
  const lowPrice = toPrice(body?.lowPrice);
  const medianPrice = toPrice(body?.medianPrice);
  const highPrice = toPrice(body?.highPrice);

  if (
    !Number.isFinite(lowPrice) || !Number.isFinite(medianPrice) || !Number.isFinite(highPrice) ||
    lowPrice < 0 || lowPrice > medianPrice || medianPrice > highPrice
  ) {
    return NextResponse.json({
      error: "La valeur basse doit être inférieure ou égale à la valeur centrale, elle-même inférieure ou égale à la valeur haute.",
    }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateAdminEstimationRange(id, { highPrice, lowPrice, medianPrice }, session);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 404 });

  return NextResponse.json({ highPrice, lowPrice, medianPrice });
}

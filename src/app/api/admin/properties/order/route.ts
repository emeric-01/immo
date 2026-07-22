import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { adminRest } from "@/lib/properties";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === "string" && uuidPattern.test(id));
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session || !(await hasAdminPermission(session, "properties:write"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json() as { publishedIds?: unknown; soldIds?: unknown };
    if (!validIds(body.publishedIds) || !validIds(body.soldIds)) {
      return NextResponse.json({ error: "Ordre invalide." }, { status: 400 });
    }

    const ids = [...body.publishedIds, ...body.soldIds];
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "Un bien apparaît plusieurs fois." }, { status: 400 });
    }

    await adminRest("rpc/reorder_public_properties", {
      method: "POST",
      body: JSON.stringify({ p_published_ids: body.publishedIds, p_sold_ids: body.soldIds }),
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "L’ordre n’a pas pu être enregistré.",
    }, { status: 409 });
  }
}

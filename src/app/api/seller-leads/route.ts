import { NextResponse } from "next/server";
import { sendSellerLeadNotificationEmail } from "@/lib/email/buyer-search-emails";
import { clientSupabaseRequest } from "@/lib/client-access/supabase";
import { attributionColumns, getCurrentAttribution, recordAttributedConversion, type AttributionSnapshot } from "@/lib/attribution";
import { linkCrmContactsToClientAccount } from "@/lib/admin/crm-contacts";

type SellerLeadPayload = {
  address?: unknown;
  city?: unknown;
  confidenceScore?: unknown;
  consent?: unknown;
  estimatedHighPrice?: unknown;
  estimatedLowPrice?: unknown;
  estimatedMedianPrice?: unknown;
  estimatedPricePerM2?: unknown;
  estimationId?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  propertyType?: unknown;
  requestType?: unknown;
  rooms?: unknown;
  surfaceM2?: unknown;
  website?: unknown;
  estimationInput?: unknown;
  estimationResult?: unknown;
};

const propertyTypes = new Set(["house", "apartment", "land", "other"]);
const requestTypes = new Set(["detailed_study", "human_estimate"]);
const phonePattern = /^(?:(?:\+33|0)\s?)[1-9](?:[\s.-]?\d{2}){4}$/;

function readPositiveNumber(value: unknown, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= maximum
    ? Math.round(value)
    : undefined;
}

function readShortString(value: unknown, maximumLength = 120) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized && normalized.length <= maximumLength ? normalized : undefined;
}

async function saveLeadAccountAndEstimation({
  email,
  firstName,
  lastName,
  phone,
  payload,
  attribution,
}: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  payload: SellerLeadPayload;
  attribution: AttributionSnapshot | null;
}) {
  const normalizedEmail = email.toLowerCase();
  const existing = await clientSupabaseRequest<Array<{ id: string }>>(
    `client_accounts?email=eq.${encodeURIComponent(normalizedEmail)}&select=id&limit=1`,
  );
  let accountId = existing[0]?.id;

  if (accountId) {
    await clientSupabaseRequest(`client_accounts?id=eq.${encodeURIComponent(accountId)}`, {
      body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }),
      method: "PATCH",
    });
    if (attribution) await clientSupabaseRequest(`client_accounts?id=eq.${encodeURIComponent(accountId)}&attribution_visitor_id=is.null`, { body: JSON.stringify({ attribution_visitor_id: attribution.visitorAttributionId, attributed_admin_user_id: attribution.attributedAdminUserId, first_attribution: attribution }), method: "PATCH" });
  } else {
    const created = await clientSupabaseRequest<Array<{ id: string }>>(
      "client_accounts?select=id",
      {
        body: JSON.stringify({
          access_enabled: true,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          phone,
          preferred_channel: "email",
          preferred_channels: ["email"],
          ...(attribution ? { attribution_visitor_id: attribution.visitorAttributionId, attributed_admin_user_id: attribution.attributedAdminUserId, first_attribution: attribution } : {}),
        }),
        headers: { Prefer: "return=representation" },
        method: "POST",
      },
    );
    accountId = created[0]?.id;
  }

  if (!accountId) {
    return accountId;
  }

  await linkCrmContactsToClientAccount(accountId, normalizedEmail, phone);

  const estimationId = readShortString(payload.estimationId);
  if (estimationId) {
    await clientSupabaseRequest(
      `property_estimations?id=eq.${encodeURIComponent(estimationId)}&client_account_id=is.null`,
      {
        body: JSON.stringify({ client_account_id: accountId }),
        method: "PATCH",
      },
    );
    return accountId;
  }

  if (!payload.estimationInput || !payload.estimationResult) {
    return;
  }

  const input = payload.estimationInput as Record<string, unknown>;
  const result = payload.estimationResult as Record<string, unknown>;
  const selectedAddress = input.selectedAddress as Record<string, unknown> | undefined;
  const postCodes = selectedAddress?.postCode;

  await clientSupabaseRequest("property_estimations", {
    body: JSON.stringify({
      address_label: readShortString(result.addressLabel, 250) || readShortString(payload.address, 250),
      city_name: readShortString(payload.city, 120),
      client_account_id: accountId,
      confidence_score: readPositiveNumber(payload.confidenceScore, 5),
      high_price: readPositiveNumber(payload.estimatedHighPrice, 100_000_000),
      generated_high_price: readPositiveNumber(payload.estimatedHighPrice, 100_000_000),
      input_payload: input,
      low_price: readPositiveNumber(payload.estimatedLowPrice, 100_000_000),
      generated_low_price: readPositiveNumber(payload.estimatedLowPrice, 100_000_000),
      median_price: readPositiveNumber(payload.estimatedMedianPrice, 100_000_000),
      generated_median_price: readPositiveNumber(payload.estimatedMedianPrice, 100_000_000),
      postal_code: Array.isArray(postCodes) ? readShortString(postCodes[0], 12) : undefined,
      price_per_m2: readPositiveNumber(payload.estimatedPricePerM2, 100_000),
      property_type: payload.propertyType,
      generated_result_payload: result,
      result_payload: result,
      record_origin: "client",
      rooms: readPositiveNumber(payload.rooms, 100),
      source: readShortString(result.source, 120) || "Immo Data",
      surface_m2: readPositiveNumber(payload.surfaceM2, 100_000),
      ...attributionColumns(attribution),
    }),
    method: "POST",
  });
  return accountId;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SellerLeadPayload;

    if (typeof payload.website === "string" && payload.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const address = typeof payload.address === "string" ? payload.address.trim() : "";
    const city = typeof payload.city === "string" ? payload.city.trim() : "";
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const firstName = readShortString(payload.firstName, 80);
    const lastName = readShortString(payload.lastName, 80);
    const propertyType = typeof payload.propertyType === "string" ? payload.propertyType : "";
    const requestType = typeof payload.requestType === "string" ? payload.requestType : "detailed_study";

    if (
      address.length < 5 ||
      city.length < 2 ||
      !phonePattern.test(phone) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !firstName ||
      !lastName ||
      !propertyTypes.has(propertyType) ||
      !requestTypes.has(requestType) ||
      payload.consent !== "accepted"
    ) {
      return NextResponse.json(
        { error: "Vérifiez l’adresse, le téléphone et votre accord pour être recontacté." },
        { status: 400 },
      );
    }

    const attribution = await getCurrentAttribution();
    const accountId = await saveLeadAccountAndEstimation({ email, firstName, lastName, phone, payload, attribution });
    await recordAttributedConversion(attribution, "contact", accountId ?? null, "/estimation/resultat");

    await sendSellerLeadNotificationEmail({
      attribution,
      address,
      city,
      confidenceScore: readPositiveNumber(payload.confidenceScore, 5),
      estimatedHighPrice: readPositiveNumber(payload.estimatedHighPrice, 100_000_000),
      estimatedLowPrice: readPositiveNumber(payload.estimatedLowPrice, 100_000_000),
      estimatedMedianPrice: readPositiveNumber(payload.estimatedMedianPrice, 100_000_000),
      estimatedPricePerM2: readPositiveNumber(payload.estimatedPricePerM2, 100_000),
      estimationId: readShortString(payload.estimationId),
      email,
      firstName,
      lastName,
      phone,
      propertyType,
      requestType,
      rooms: readPositiveNumber(payload.rooms, 100),
      surfaceM2: readPositiveNumber(payload.surfaceM2, 100_000),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Seller lead submission failed", error);
    return NextResponse.json(
      { error: "La demande est temporairement indisponible. Vous pouvez réessayer dans quelques instants." },
      { status: 502 },
    );
  }
}

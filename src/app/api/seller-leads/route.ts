import { NextResponse } from "next/server";
import { sendSellerLeadNotificationEmail } from "@/lib/email/buyer-search-emails";

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

    await sendSellerLeadNotificationEmail({
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

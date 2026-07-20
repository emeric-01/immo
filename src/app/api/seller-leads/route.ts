import { NextResponse } from "next/server";
import { sendSellerLeadNotificationEmail } from "@/lib/email/buyer-search-emails";

type SellerLeadPayload = {
  address?: unknown;
  city?: unknown;
  consent?: unknown;
  phone?: unknown;
  propertyType?: unknown;
  website?: unknown;
};

const propertyTypes = new Set(["house", "apartment", "land", "other"]);
const phonePattern = /^(?:(?:\+33|0)\s?)[1-9](?:[\s.-]?\d{2}){4}$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SellerLeadPayload;

    if (typeof payload.website === "string" && payload.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const address = typeof payload.address === "string" ? payload.address.trim() : "";
    const city = typeof payload.city === "string" ? payload.city.trim() : "";
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const propertyType = typeof payload.propertyType === "string" ? payload.propertyType : "";

    if (
      address.length < 5 ||
      city.length < 2 ||
      !phonePattern.test(phone) ||
      !propertyTypes.has(propertyType) ||
      payload.consent !== "accepted"
    ) {
      return NextResponse.json(
        { error: "Vérifiez l’adresse, le téléphone et votre accord pour être recontacté." },
        { status: 400 },
      );
    }

    await sendSellerLeadNotificationEmail({ address, city, phone, propertyType });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Seller lead submission failed", error);
    return NextResponse.json(
      { error: "La demande est temporairement indisponible. Vous pouvez réessayer dans quelques instants." },
      { status: 502 },
    );
  }
}

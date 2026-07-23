import { NextResponse } from "next/server";
import { sendContactRequestEmail } from "@/lib/email/buyer-search-emails";

type ContactPayload = {
  consent?: unknown;
  email?: unknown;
  formStartedAt?: unknown;
  message?: unknown;
  name?: unknown;
  phone?: unknown;
  subject?: unknown;
  website?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:(?:\+33|0)\s?)[1-9](?:[\s.-]?\d{2}){4}$/;
const allowedSubjects = new Set([
  "Acheter un bien",
  "Vendre un bien",
  "Faire estimer un bien",
  "Suivre une demande",
  "Rejoindre l’agence",
  "Autre demande",
]);

function readString(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized.length <= maximum ? normalized : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload;

    if (readString(payload.website, 200)) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const name = readString(payload.name, 100);
    const email = readString(payload.email, 180);
    const phone = readString(payload.phone, 30);
    const subject = readString(payload.subject, 80);
    const message = readString(payload.message, 2500);
    const formStartedAt = Number(payload.formStartedAt);
    const completedTooQuickly = Number.isFinite(formStartedAt) && Date.now() - formStartedAt < 1_500;

    if (
      name.length < 2 ||
      message.length < 10 ||
      !allowedSubjects.has(subject) ||
      (!email && !phone) ||
      (email && !emailPattern.test(email)) ||
      (phone && !phonePattern.test(phone)) ||
      payload.consent !== true ||
      completedTooQuickly
    ) {
      return NextResponse.json(
        { error: "Vérifiez vos coordonnées, l’objet et votre message." },
        { status: 400 },
      );
    }

    await sendContactRequestEmail({ email: email || undefined, message, name, phone: phone || undefined, subject });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contact form submission failed", error);
    return NextResponse.json(
      { error: "Votre message n’a pas pu être envoyé. Vous pouvez nous appeler ou réessayer dans quelques instants." },
      { status: 502 },
    );
  }
}

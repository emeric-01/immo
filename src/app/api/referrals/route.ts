import { NextResponse } from "next/server";
import { sendReferralLeadEmails } from "@/lib/email/buyer-search-emails";
import { createReferral, referralSchema } from "@/lib/referrals";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = referralSchema.safeParse(payload);

    if (typeof payload?.website === "string" && payload.website.trim()) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Vérifiez les informations du formulaire." },
        { status: 400 },
      );
    }

    const referral = await createReferral(parsed.data);
    const emailResult = await sendReferralLeadEmails({ input: parsed.data, referralId: referral.id });

    return NextResponse.json(
      { id: referral.id, success: true, warnings: emailResult.warnings },
      { status: 201 },
    );
  } catch (error) {
    console.error("Referral submission failed", error);
    return NextResponse.json(
      { error: "Le parrainage est temporairement indisponible. Réessayez dans quelques instants." },
      { status: 502 },
    );
  }
}

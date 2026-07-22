import "server-only";

import { z } from "zod";
import { clientSupabaseRequest } from "@/lib/client-access/supabase";

const frenchPhonePattern = /^(?:(?:\+33|0)\s?)[1-9](?:[\s.-]?\d{2}){4}$/;

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("L’adresse email de votre proche est invalide."),
]);

export const referralSchema = z.object({
  informedConsent: z.literal(true, { error: "L’accord de votre proche est obligatoire." }),
  message: z.string().trim().max(1000, "Le message est trop long.").optional().default(""),
  privacyConsent: z.literal(true, { error: "Votre accord est obligatoire pour envoyer le parrainage." }),
  projectKind: z.enum(["buy", "sell"]),
  propertyCity: z.string().trim().min(2, "Renseignez la ville ou le secteur du projet.").max(120),
  propertyType: z.enum(["apartment", "house", "land", "other"]),
  referredEmail: optionalEmail.optional().default(""),
  referredFirstName: z.string().trim().min(2, "Renseignez le prénom de votre proche.").max(80),
  referredLastName: z.string().trim().min(2, "Renseignez le nom de votre proche.").max(80),
  referredPhone: z.string().trim().regex(frenchPhonePattern, "Le téléphone de votre proche est invalide."),
  sponsorEmail: z.string().trim().email("Votre adresse email est invalide.").max(180),
  sponsorFirstName: z.string().trim().min(2, "Renseignez votre prénom.").max(80),
  sponsorLastName: z.string().trim().min(2, "Renseignez votre nom.").max(80),
  sponsorPhone: z.string().trim().regex(frenchPhonePattern, "Votre numéro de téléphone est invalide."),
  website: z.string().max(200).optional().default(""),
});

export type ReferralInput = z.infer<typeof referralSchema>;

type ReferralRow = { id: string };

export async function createReferral(input: ReferralInput) {
  const rows = await clientSupabaseRequest<ReferralRow[]>("referral_leads?select=id", {
    body: JSON.stringify({
      consent_recorded_at: new Date().toISOString(),
      message: input.message || null,
      project_kind: input.projectKind,
      property_city: input.propertyCity,
      property_type: input.propertyType,
      referred_email: input.referredEmail || null,
      referred_first_name: input.referredFirstName,
      referred_last_name: input.referredLastName,
      referred_phone: input.referredPhone,
      source: "website_referral_page",
      sponsor_email: input.sponsorEmail.toLowerCase(),
      sponsor_first_name: input.sponsorFirstName,
      sponsor_last_name: input.sponsorLastName,
      sponsor_phone: input.sponsorPhone,
    }),
    headers: { Prefer: "return=representation" },
    method: "POST",
  });

  if (!rows[0]) {
    throw new Error("La création du parrainage n’a retourné aucun identifiant.");
  }

  return rows[0];
}

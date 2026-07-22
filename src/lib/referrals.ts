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

export const referralStatuses = ["new", "contacted", "qualified", "signed", "rewarded", "rejected"] as const;
export type ReferralStatus = (typeof referralStatuses)[number];

export type ReferralRow = {
  consent_recorded_at: string;
  created_at: string;
  id: string;
  message: string | null;
  project_kind: "buy" | "sell";
  property_city: string;
  property_type: "apartment" | "house" | "land" | "other";
  referred_email: string | null;
  referred_first_name: string;
  referred_last_name: string;
  referred_phone: string;
  reward_paid_at: string | null;
  source: string;
  sponsor_client_account_id: string | null;
  sponsor_email: string;
  sponsor_first_name: string;
  sponsor_last_name: string;
  sponsor_phone: string;
  status: ReferralStatus;
  updated_at: string;
};

export async function createReferral(input: ReferralInput) {
  const normalizedSponsorEmail = input.sponsorEmail.trim().toLowerCase();
  let sponsorClientAccountId: string | null = null;

  try {
    const accounts = await clientSupabaseRequest<Array<{ id: string }>>(
      `client_accounts?email=eq.${encodeURIComponent(normalizedSponsorEmail)}&select=id&limit=1`,
    );
    sponsorClientAccountId = accounts[0]?.id ?? null;
  } catch (error) {
    console.error("Referral account matching failed", error);
  }

  const rows = await clientSupabaseRequest<Array<Pick<ReferralRow, "id">>>("referral_leads?select=id", {
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
      sponsor_client_account_id: sponsorClientAccountId,
      sponsor_email: normalizedSponsorEmail,
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

export function formatReferralProjectKind(value: ReferralRow["project_kind"]) {
  return value === "sell" ? "Vente" : "Achat";
}

export function formatReferralPropertyType(value: ReferralRow["property_type"]) {
  return {
    apartment: "Appartement",
    house: "Maison",
    land: "Terrain",
    other: "Autre bien",
  }[value];
}

export function formatReferralStatus(value: ReferralStatus) {
  return {
    contacted: "Contacté",
    new: "Reçu",
    qualified: "Projet qualifié",
    rejected: "Non retenu",
    rewarded: "Prime versée",
    signed: "Transaction signée",
  }[value];
}

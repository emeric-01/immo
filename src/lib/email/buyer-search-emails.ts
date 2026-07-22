import "server-only";

import {
  normalizePropertyTypes,
  optionLabel,
  preferredChannelOptions,
  propertyTypeLabels,
  purchaseTimelineOptions,
} from "@/lib/buyer-search/options";
import type { BuyerSearchSubmissionResult } from "@/lib/buyer-search/database";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import type { ReferralInput } from "@/lib/referrals";

type EmailDeliveryResult = {
  warnings: string[];
};

type EmailMessage = {
  html: string;
  subject: string;
  text: string;
  to: string | string[];
};

type EmailConfig = {
  adminEmail: string | null;
  apiKey: string;
  appUrl: string;
  from: string;
  provider: "brevo" | "resend";
};

export async function sendBuyerSearchCreatedEmails({
  data,
  result,
}: {
  data: BuyerSearchFormData;
  result: BuyerSearchSubmissionResult;
}): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config) {
    return {
      warnings: ["Emails transactionnels non configures : aucun email de confirmation n'a ete envoye."],
    };
  }

  const warnings: string[] = [];
  const messages: EmailMessage[] = [buildClientConfirmationEmail(config, data)];

  if (config.adminEmail) {
    messages.push(buildAdminNewSearchEmail(config, data, result.id));
  }

  await Promise.all(
    messages.map(async (message) => {
      try {
        await sendEmail(config, message);
      } catch (error) {
        console.error("Buyer search email failed", error);
        warnings.push(`Email non envoye : ${message.subject}`);
      }
    }),
  );

  return { warnings };
}

export async function sendBuyerSearchUpdatedEmails({
  data,
  searchId,
}: {
  data: BuyerSearchFormData;
  searchId: string;
}): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config?.adminEmail) {
    return { warnings: [] };
  }

  try {
    await sendEmail(config, buildAdminUpdatedSearchEmail(config, data, searchId));
    return { warnings: [] };
  } catch (error) {
    console.error("Buyer search update email failed", error);
    return {
      warnings: ["Notification admin non envoyee pour la modification client."],
    };
  }
}

export async function sendClientLoginCodeEmail({
  code,
  email,
  firstName,
}: {
  code: string;
  email: string;
  firstName: string;
}) {
  const config = getEmailConfig();

  if (!config) {
    throw new Error("Emails transactionnels non configures.");
  }

  await sendEmail(config, {
    html: emailLayout(
      "Votre code de connexion",
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Bonjour ${escapeHtml(firstName || "")},</p>
        <p style="margin:0 0 18px;color:#555f70;line-height:1.6;">Utilisez ce code pour acceder a votre espace client Les Jumelles Immo :</p>
        <p style="margin:0 0 18px;border:1px solid #e6d4c2;border-radius:8px;background:#fbf7f2;padding:18px;text-align:center;font-size:30px;font-weight:800;letter-spacing:.18em;color:#111;">${escapeHtml(code)}</p>
        <p style="margin:0;color:#687084;font-size:13px;line-height:1.5;">Ce code est valable 10 minutes et ne peut etre utilise qu'une seule fois.</p>
      `,
    ),
    subject: "Votre code de connexion Les Jumelles Immo",
    text: `Votre code de connexion est ${code}. Il est valable 10 minutes.`,
    to: email,
  });
}

export async function sendEstimationVolumeAlertEmail({
  globalCount,
  ipCount,
  scope,
  windowStartedAt,
}: {
  globalCount: number;
  ipCount: number;
  scope: "global" | "ip";
  windowStartedAt: string;
}) {
  const config = getEmailConfig();

  if (!config) {
    throw new Error("Emails transactionnels non configures.");
  }

  const recipient = process.env.ESTIMATION_ALERT_EMAIL?.trim() || "contact@jumellesimmo.fr";
  const reason = scope === "global"
    ? `${globalCount} estimations ont été demandées sur l’ensemble du site pendant la même heure.`
    : `Une même adresse IP hachée a demandé ${ipCount} estimations pendant la même heure.`;
  const firewallUrl = "https://vercel.com/emeric-01s-projects/immo/firewall";

  await sendEmail(config, {
    html: emailLayout(
      "Alerte volume d’estimations",
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">${escapeHtml(reason)}</p>
        <div style="margin:0 0 18px;border:1px solid #e6d4c2;border-radius:8px;background:#fbf7f2;padding:16px;color:#111;line-height:1.7;">
          <strong>Fenêtre :</strong> ${escapeHtml(new Date(windowStartedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }))}<br>
          <strong>Volume IP :</strong> ${ipCount}<br>
          <strong>Volume global :</strong> ${globalCount}<br>
          <strong>Protection :</strong> la limite Vercel de 5 estimations par heure et par IP reste active.
        </div>
        <p style="margin:0;"><a href="${firewallUrl}" style="color:#9f5d33;font-weight:700;">Consulter le pare-feu Vercel</a></p>
      `,
    ),
    subject: scope === "global"
      ? `[Alerte] ${globalCount} estimations demandées en une heure`
      : `[Alerte] Une IP approche la limite d’estimations`,
    text: `${reason}\nFenêtre : ${windowStartedAt}\nVolume IP : ${ipCount}\nVolume global : ${globalCount}\nPare-feu : ${firewallUrl}`,
    to: recipient,
  });
}

export async function sendSellerLeadNotificationEmail({
  address,
  city,
  phone,
  propertyType,
  requestType,
}: {
  address: string;
  city: string;
  phone: string;
  propertyType: string;
  requestType: string;
}) {
  const config = getEmailConfig();

  if (!config) {
    throw new Error("Emails transactionnels non configures.");
  }

  const recipient = config.adminEmail || "contact@jumellesimmo.fr";
  const typeLabels: Record<string, string> = {
    apartment: "Appartement",
    house: "Maison",
    land: "Terrain",
    other: "Autre bien",
  };
  const propertyLabel = typeLabels[propertyType] || "Bien immobilier";
  const requestLabel = requestType === "human_estimate"
    ? "Estimation humaine sur place"
    : "Étude immobilière détaillée";
  const requestIntro = requestType === "human_estimate"
    ? "Une personne souhaite être rappelée pour organiser une estimation de son bien sur place."
    : "Une personne souhaite être rappelée pour recevoir une étude immobilière plus détaillée.";

  await sendEmail(config, {
    html: emailLayout(
      `Nouvelle demande vendeur à ${city}`,
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">${escapeHtml(requestIntro)}</p>
        <div style="border:1px solid #e8e0d8;border-radius:8px;padding:16px;margin:18px 0;color:#555f70;line-height:1.8;">
          <strong style="color:#111;">Demande :</strong> ${escapeHtml(requestLabel)}<br />
          <strong style="color:#111;">Type de bien :</strong> ${escapeHtml(propertyLabel)}<br />
          <strong style="color:#111;">Adresse :</strong> ${escapeHtml(address)}<br />
          <strong style="color:#111;">Secteur :</strong> ${escapeHtml(city)}<br />
          <strong style="color:#111;">Téléphone :</strong> <a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}" style="color:#9f5d33;">${escapeHtml(phone)}</a>
        </div>
      `,
    ),
    subject: `🔔 ${requestLabel} — ${city}`,
    text: `${requestLabel}\nType : ${propertyLabel}\nAdresse : ${address}\nSecteur : ${city}\nTéléphone : ${phone}`,
    to: recipient,
  });
}

export async function sendReferralLeadEmails({
  input,
  referralId,
}: {
  input: ReferralInput;
  referralId: string;
}): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config) {
    return { warnings: ["Emails transactionnels non configurés pour le parrainage."] };
  }

  const warnings: string[] = [];
  const projectLabel = input.projectKind === "sell" ? "Vente" : "Achat";
  const propertyLabels: Record<ReferralInput["propertyType"], string> = {
    apartment: "Appartement",
    house: "Maison",
    land: "Terrain",
    other: "Autre bien",
  };
  const adminRecipient = config.adminEmail || "contact@jumellesimmo.fr";
  const messages: EmailMessage[] = [
    {
      html: emailLayout(
        "Votre parrainage est enregistré",
        `
          <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Bonjour ${escapeHtml(input.sponsorFirstName)},</p>
          <p style="margin:0 0 18px;color:#555f70;line-height:1.6;">Merci de nous avoir présenté ${escapeHtml(input.referredFirstName)}. Notre équipe vérifie la demande et prendra rapidement contact avec votre proche.</p>
          <div style="border:1px solid #e8e0d8;border-radius:8px;background:#fbf7f2;padding:16px;color:#555f70;line-height:1.8;">
            <strong style="color:#111;">Projet :</strong> ${escapeHtml(projectLabel)} d’un ${escapeHtml(propertyLabels[input.propertyType].toLowerCase())}<br />
            <strong style="color:#111;">Secteur :</strong> ${escapeHtml(input.propertyCity)}<br />
            <strong style="color:#111;">Référence :</strong> ${escapeHtml(referralId.slice(0, 8).toUpperCase())}
          </div>
          <p style="margin:18px 0 0;color:#687084;font-size:13px;line-height:1.5;">La prime de 500 € est versée si la transaction est conclue par Les Jumelles Immo, selon les conditions du programme.</p>
        `,
      ),
      subject: "Votre parrainage Les Jumelles Immo est enregistré",
      text: `Bonjour ${input.sponsorFirstName}, votre parrainage de ${input.referredFirstName} est enregistré. Projet : ${projectLabel}, ${propertyLabels[input.propertyType]}, ${input.propertyCity}. Référence : ${referralId.slice(0, 8).toUpperCase()}.`,
      to: input.sponsorEmail,
    },
    {
      html: emailLayout(
        "Nouveau parrainage immobilier",
        `
          <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Une nouvelle recommandation a été enregistrée depuis la page parrainage.</p>
          <div style="border:1px solid #e8e0d8;border-radius:8px;padding:16px;color:#555f70;line-height:1.8;">
            <strong style="color:#111;">Parrain :</strong> ${escapeHtml(`${input.sponsorFirstName} ${input.sponsorLastName}`)}<br />
            <strong style="color:#111;">Contact :</strong> <a href="mailto:${escapeHtml(input.sponsorEmail)}" style="color:#9f5d33;">${escapeHtml(input.sponsorEmail)}</a> · ${escapeHtml(input.sponsorPhone)}<br />
            <strong style="color:#111;">Proche :</strong> ${escapeHtml(`${input.referredFirstName} ${input.referredLastName}`)}<br />
            <strong style="color:#111;">Contact :</strong> ${escapeHtml(input.referredPhone)}${input.referredEmail ? ` · ${escapeHtml(input.referredEmail)}` : ""}<br />
            <strong style="color:#111;">Projet :</strong> ${escapeHtml(projectLabel)} · ${escapeHtml(propertyLabels[input.propertyType])} · ${escapeHtml(input.propertyCity)}<br />
            <strong style="color:#111;">Référence :</strong> ${escapeHtml(referralId)}
          </div>
          ${input.message ? `<p style="margin:18px 0 0;color:#555f70;line-height:1.6;"><strong style="color:#111;">Message :</strong> ${escapeHtml(input.message)}</p>` : ""}
        `,
      ),
      subject: `🔔 Nouveau parrainage — ${input.propertyCity}`,
      text: `Nouveau parrainage\nParrain : ${input.sponsorFirstName} ${input.sponsorLastName}, ${input.sponsorEmail}, ${input.sponsorPhone}\nProche : ${input.referredFirstName} ${input.referredLastName}, ${input.referredPhone}\nProjet : ${projectLabel}, ${propertyLabels[input.propertyType]}, ${input.propertyCity}\nRéférence : ${referralId}`,
      to: adminRecipient,
    },
  ];

  await Promise.all(messages.map(async (message) => {
    try {
      await sendEmail(config, message);
    } catch (error) {
      console.error("Referral email failed", error);
      warnings.push(`Email non envoyé : ${message.subject}`);
    }
  }));

  return { warnings };
}

function getEmailConfig(): EmailConfig | null {
  const from = process.env.EMAIL_FROM?.trim();
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "auto";
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();

  if (!from) {
    return null;
  }

  if ((provider === "brevo" || provider === "auto") && brevoApiKey) {
    return {
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || null,
      apiKey: brevoApiKey,
      appUrl: getAppUrl(),
      from,
      provider: "brevo",
    };
  }

  if ((provider === "resend" || provider === "auto") && resendApiKey) {
    return {
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || null,
      apiKey: resendApiKey,
      appUrl: getAppUrl(),
      from,
      provider: "resend",
    };
  }

  return null;
}

async function sendEmail(config: EmailConfig, message: EmailMessage) {
  if (config.provider === "brevo") {
    await sendBrevoEmail(config, message);
    return;
  }

  await sendResendEmail(config, message);
}

async function sendResendEmail(config: EmailConfig, message: EmailMessage) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: config.from,
      html: message.html,
      subject: message.subject,
      text: message.text,
      to: message.to,
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${error}`);
  }
}

async function sendBrevoEmail(config: EmailConfig, message: EmailMessage) {
  const sender = parseEmailIdentity(config.from);
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).map((recipient) => {
    const parsedRecipient = parseEmailIdentity(recipient);

    return {
      email: parsedRecipient.email,
      ...(parsedRecipient.name ? { name: parsedRecipient.name } : {}),
    };
  });

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      htmlContent: message.html,
      sender,
      subject: message.subject,
      textContent: message.text,
      to: recipients,
    }),
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${error}`);
  }
}

function parseEmailIdentity(value: string) {
  const match = value.match(/^\s*(?:"?([^"<]*)"?)?\s*<([^>]+)>\s*$/);

  if (!match) {
    return {
      email: value.trim(),
    };
  }

  return {
    email: match[2].trim(),
    name: match[1]?.trim() || undefined,
  };
}

function buildClientConfirmationEmail(
  config: EmailConfig,
  data: BuyerSearchFormData,
): EmailMessage {
  const projectUrl = `${config.appUrl}/client/login?email=${encodeURIComponent(data.contact.email.trim().toLowerCase())}`;
  const title = "Votre recherche Les Jumelles Immo est bien enregistree";
  const summary = buildSearchSummary(data);

  return {
    html: emailLayout(
      title,
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Bonjour ${escapeHtml(data.contact.firstName)},</p>
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Votre recherche immobiliere est bien enregistree. Nous reviendrons vers vous des qu'un bien correspondra a vos criteres.</p>
        ${summary}
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(projectUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:8px;padding:13px 18px;font-weight:700;">Acceder a mon espace client</a>
        </p>
      `,
    ),
    subject: "Votre recherche immobiliere est enregistree",
    text: [
      `Bonjour ${data.contact.firstName},`,
      "Votre recherche immobiliere est bien enregistree.",
      `Espace client : ${projectUrl}`,
      formatTextSummary(data),
    ]
      .filter(Boolean)
      .join("\n\n"),
    to: data.contact.email.trim().toLowerCase(),
  };
}

function buildAdminNewSearchEmail(config: EmailConfig, data: BuyerSearchFormData, searchId: string): EmailMessage {
  const detailUrl = `${config.appUrl}/admin/recherches/${searchId}`;
  const title = "Nouvelle demande acheteur";

  return {
    html: emailLayout(
      title,
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Une nouvelle demande acheteur vient d'etre enregistree.</p>
        ${buildAdminContactBlock(data)}
        ${buildSearchSummary(data)}
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(detailUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:8px;padding:13px 18px;font-weight:700;">Voir la demande</a>
        </p>
      `,
    ),
    subject: `Nouvelle demande acheteur - ${data.contact.firstName} ${data.contact.lastName}`,
    text: [
      "Nouvelle demande acheteur.",
      `${data.contact.firstName} ${data.contact.lastName}`,
      data.contact.email,
      data.contact.phone,
      `Detail admin : ${detailUrl}`,
      formatTextSummary(data),
    ].join("\n"),
    to: config.adminEmail ?? "",
  };
}

function buildAdminUpdatedSearchEmail(config: EmailConfig, data: BuyerSearchFormData, searchId: string): EmailMessage {
  const detailUrl = `${config.appUrl}/admin/recherches/${searchId}`;
  const title = "Recherche modifiee par le client";

  return {
    html: emailLayout(
      title,
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Un client a modifie sa recherche depuis son espace client.</p>
        ${buildAdminContactBlock(data)}
        ${buildSearchSummary(data)}
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(detailUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:8px;padding:13px 18px;font-weight:700;">Voir la demande</a>
        </p>
      `,
    ),
    subject: `Recherche modifiee - ${data.contact.firstName} ${data.contact.lastName}`,
    text: [
      "Recherche modifiee par le client.",
      `${data.contact.firstName} ${data.contact.lastName}`,
      data.contact.email,
      data.contact.phone,
      `Detail admin : ${detailUrl}`,
      formatTextSummary(data),
    ].join("\n"),
    to: config.adminEmail ?? "",
  };
}

function buildAdminContactBlock(data: BuyerSearchFormData) {
  return `
    <div style="border:1px solid #e8e0d8;border-radius:8px;padding:16px;margin:18px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#111;">Contact</p>
      <p style="margin:0;color:#555f70;line-height:1.6;">
        ${escapeHtml(data.contact.firstName)} ${escapeHtml(data.contact.lastName)}<br />
        ${escapeHtml(data.contact.email)}<br />
        ${escapeHtml(data.contact.phone)}<br />
        Canal privilegie : ${escapeHtml(optionLabel(preferredChannelOptions, data.contact.preferredChannel) || "Non renseigne")}
      </p>
    </div>
  `;
}

function buildSearchSummary(data: BuyerSearchFormData) {
  const rows: Array<[string, string]> = [
    ["Type de bien", formatPropertyTypes(data)],
    ["Localisation", formatLocationSummary(data)],
    ["Budget maximum", formatCurrency(data.property.maximumBudget)],
    ["Surface minimale", `${data.characteristics.minimumLivingArea ?? 0} m2`],
    ...(data.preferences.minimumLandArea ? ([["Terrain minimum", `${data.preferences.minimumLandArea} m2`]] as Array<[string, string]>) : []),
    ["Chambres min.", String(data.characteristics.minimumBedrooms ?? 0)],
    ["Delai d'achat", optionLabel(purchaseTimelineOptions, data.project.purchaseTimeline) || "Non renseigne"],
  ];

  return `
    <div style="border-top:1px solid #eee6df;margin-top:24px;padding-top:18px;">
      <p style="margin:0 0 12px;font-weight:700;color:#111;">Resume de recherche</p>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="border-bottom:1px solid #eee6df;padding:10px 0;color:#687084;">${escapeHtml(label)}</td>
                  <td style="border-bottom:1px solid #eee6df;padding:10px 0;text-align:right;color:#111;font-weight:700;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function emailLayout(title: string, content: string) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f7f5f2;font-family:Arial,sans-serif;color:#111;">
        <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-style:italic;line-height:1;">les jumelles</div>
            <div style="color:#d2a476;font-weight:700;letter-spacing:.08em;">IMMO</div>
          </div>
          <div style="background:#fff;border:1px solid #e3dcd4;border-radius:8px;padding:28px;">
            <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.05;font-weight:500;">${escapeHtml(title)}</h1>
            ${content}
          </div>
        </div>
      </body>
    </html>
  `;
}

function formatTextSummary(data: BuyerSearchFormData) {
  return [
    `Type de bien : ${formatPropertyTypes(data)}`,
    `Localisation : ${formatLocationSummary(data)}`,
    `Budget maximum : ${formatCurrency(data.property.maximumBudget)}`,
    `Surface minimale : ${data.characteristics.minimumLivingArea ?? 0} m2`,
    data.preferences.minimumLandArea ? `Terrain minimum : ${data.preferences.minimumLandArea} m2` : "",
  ].filter(Boolean).join("\n");
}

function formatPropertyTypes(data: BuyerSearchFormData) {
  const selectedTypes = normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type);

  return selectedTypes.length > 0
    ? selectedTypes.map((type) => propertyTypeLabels[type]).join(", ")
    : "Non renseigne";
}

function formatLocationSummary(data: BuyerSearchFormData) {
  if (data.location.cities.length === 0) {
    return "Non renseigne";
  }

  return data.location.cities.map((city) => `${city.name} (${city.radiusKm ?? 2} km)`).join(", ");
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getAppUrl() {
  const explicitUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!explicitUrl) {
    return "http://127.0.0.1:3001";
  }

  return explicitUrl.startsWith("http") ? explicitUrl.replace(/\/$/, "") : `https://${explicitUrl.replace(/\/$/, "")}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

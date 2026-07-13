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
  const messages: EmailMessage[] = [buildClientConfirmationEmail(config, data, result)];

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
  result: BuyerSearchSubmissionResult,
): EmailMessage {
  const access = result.clientAccess;
  const projectUrl = `${config.appUrl}/client/login`;
  const title = "Votre recherche Les Jumelles Immo est bien enregistree";
  const summary = buildSearchSummary(data);
  const accessBlock = access
    ? `
      <div style="border:1px solid #e6d4c2;border-radius:8px;background:#fbf7f2;padding:18px;margin:24px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#111;">Votre acces client</p>
        <p style="margin:0;color:#333;line-height:1.55;">
          Reference : <strong>${escapeHtml(access.reference)}</strong><br />
          Code : <strong>${escapeHtml(access.code)}</strong>
        </p>
        <p style="margin:10px 0 0;color:#687084;font-size:13px;">Conservez ces informations pour revoir ou modifier votre projet.</p>
      </div>
    `
    : "";

  return {
    html: emailLayout(
      title,
      `
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Bonjour ${escapeHtml(data.contact.firstName)},</p>
        <p style="margin:0 0 16px;color:#555f70;line-height:1.6;">Votre recherche immobiliere est bien enregistree. Nous reviendrons vers vous des qu'un bien correspondra a vos criteres.</p>
        ${accessBlock}
        ${summary}
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(projectUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:8px;padding:13px 18px;font-weight:700;">Acceder a mon projet</a>
        </p>
      `,
    ),
    subject: "Votre recherche immobiliere est enregistree",
    text: [
      `Bonjour ${data.contact.firstName},`,
      "Votre recherche immobiliere est bien enregistree.",
      access ? `Reference : ${access.reference}` : "",
      access ? `Code : ${access.code}` : "",
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

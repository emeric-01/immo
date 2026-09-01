export type AgentShareLinkAttribution = {
  campaign: string;
  code: string;
  medium: string;
  source: string;
};

export type AgentShareLinkResult =
  | { success: true; url: string }
  | { error: string; success: false };

export function buildAgentShareLink(
  input: string,
  siteUrl: string,
  attribution: AgentShareLinkAttribution,
): AgentShareLinkResult {
  const value = input.trim();

  if (!value) {
    return { error: "Collez d’abord l’URL d’une page du site.", success: false };
  }

  let site: URL;
  let destination: URL;

  try {
    site = new URL(siteUrl);
    destination = value.startsWith("/") ? new URL(value, site) : new URL(value);
  } catch {
    return { error: "Cette URL n’est pas valide.", success: false };
  }

  if (!isHttpUrl(destination) || normalizeHostname(destination.hostname) !== normalizeHostname(site.hostname)) {
    return { error: "Utilisez uniquement une URL du site Les Jumelles Immo.", success: false };
  }

  if (/^\/(?:admin|api|l)(?:\/|$)/.test(destination.pathname)) {
    return { error: "Choisissez une page publique du site.", success: false };
  }

  destination.searchParams.delete("utm_source");
  destination.searchParams.delete("utm_medium");
  destination.searchParams.delete("utm_campaign");
  destination.searchParams.set("ref", attribution.code);

  return { success: true, url: destination.toString() };
}

function isHttpUrl(url: URL) {
  return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export const siteName = "Les Jumelles Immo";

const PRODUCTION_SITE_URL = "https://jumellesimmo.fr";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

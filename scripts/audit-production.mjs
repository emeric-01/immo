const origin = new URL(process.argv[2] ?? "https://jumellesimmo.fr");
const requestedConcurrency = Number(process.env.AUDIT_CONCURRENCY ?? "6");
const concurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
  ? Math.max(1, Math.min(12, Math.floor(requestedConcurrency)))
  : 6;
const requestHeaders = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "User-Agent": "LesJumellesImmo-ProductionAudit/1.0",
};

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function extractLocations(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => decodeXml(match[1].trim()));
}

function visibleText(html) {
  return decodeXml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

async function fetchText(url) {
  const startedAt = performance.now();
  const response = await fetch(url, { headers: requestHeaders, redirect: "follow" });
  const body = await response.text();

  return {
    body,
    contentType: response.headers.get("content-type") ?? "",
    durationMs: Math.round(performance.now() - startedAt),
    finalUrl: response.url,
    status: response.status,
  };
}

async function readPublicUrls() {
  const sitemapUrl = new URL("/sitemap.xml", origin);
  const root = await fetchText(sitemapUrl);
  if (root.status !== 200) throw new Error(`Sitemap indisponible (${root.status}) : ${sitemapUrl}`);

  const rootLocations = extractLocations(root.body);
  const sitemapLocations = root.body.includes("<sitemapindex") ? rootLocations : [];
  const pageLocations = root.body.includes("<urlset") ? rootLocations : [];

  const nested = await Promise.all(sitemapLocations.map(async (url) => {
    const response = await fetchText(url);
    if (response.status !== 200) throw new Error(`Sitemap indisponible (${response.status}) : ${url}`);
    return extractLocations(response.body);
  }));

  return Array.from(new Set([...pageLocations, ...nested.flat()]))
    .filter((url) => new URL(url).origin === origin.origin)
    .sort();
}

function inspectPage(url, response) {
  const pathname = new URL(url).pathname;
  const issues = [];
  const text = visibleText(response.body);
  const isPricePage = /^\/prix-m2\/[^/]+$/.test(pathname);
  const isAgencyPage = /^\/agence-immobiliere\/[^/]+$/.test(pathname);
  const isEstimationPage = /^\/estimation-immobiliere\/[^/]+$/.test(pathname);
  const isMarketDirectory = pathname === "/prix-m2" || pathname === "/estimation-immobiliere";
  const isMarketSurface = isPricePage || isAgencyPage || isEstimationPage;

  if (response.status < 200 || response.status >= 400) issues.push(`HTTP ${response.status}`);
  if (!response.contentType.includes("text/html")) issues.push(`content-type ${response.contentType || "absent"}`);
  if (response.body.length < 500) issues.push(`contenu anormalement court (${response.body.length} octets)`);
  if (/Application error: a (?:client|server)-side exception|Internal Server Error|data-nextjs-dialog/i.test(response.body)) {
    issues.push("erreur Next.js détectée");
  }
  if (response.body.includes("Aucun snapshot de marché vérifié")) issues.push("snapshot de marché absent");
  if (response.body.includes("Historique indisponible pour")) issues.push("historique indisponible");
  if (isMarketSurface && response.body.includes("Historique encore insuffisant")) issues.push("historique insuffisant");
  if (isPricePage && response.body.includes("Aucune transaction localisée vérifiée")) issues.push("ventes localisées absentes");
  if (isPricePage && !text.includes("Évolution des prix")) issues.push("bloc d'évolution absent");
  if (isMarketSurface && !text.includes("Depuis 2014")) issues.push("historique long 2014 absent");
  if (isMarketSurface && !text.includes("Immo Data stocké + DVF")) issues.push("provenance de l'historique absente");
  if ((isPricePage || isAgencyPage) && !/\d[\d\s ]*\s€\s*\/m²/.test(text)) issues.push("prix au m² absent");
  if (isMarketSurface && /Évolution non publiée|Appartement non publiée|Maison non publiée/.test(text)) {
    issues.push("tendance annuelle non publiée");
  }
  if (isMarketDirectory && /Évolution (?:locale )?non publiée/.test(text)) {
    issues.push("tendance annuelle absente de l'annuaire");
  }
  if (/\bNaN\b|\bundefined\s*(?:€|m²|%|pièce)|\bnull\s*(?:€|m²|%|pièce)/i.test(text)) {
    issues.push("valeur technique visible");
  }

  return {
    durationMs: response.durationMs,
    finalUrl: response.finalUrl,
    issues,
    marketSurface: isPricePage ? "price" : isAgencyPage ? "agency" : isEstimationPage ? "estimation" : null,
    pathname,
    status: response.status,
  };
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = {
          durationMs: 0,
          finalUrl: items[index],
          issues: [error instanceof Error ? error.message : String(error)],
          pathname: new URL(items[index]).pathname,
          status: 0,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

const urls = await readPublicUrls();
const pages = await mapConcurrent(urls, async (url) => inspectPage(url, await fetchText(url)));
const failures = pages.filter((page) => page.issues.length > 0);
const marketSurfaces = Object.fromEntries(["price", "agency", "estimation"].map((surface) => {
  const matching = pages.filter((page) => page.marketSurface === surface);
  return [surface, {
    checked: matching.length,
    failed: matching.filter((page) => page.issues.length > 0).length,
  }];
}));
const slowest = [...pages]
  .sort((left, right) => right.durationMs - left.durationMs)
  .slice(0, 10)
  .map(({ durationMs, pathname, status }) => ({ durationMs, pathname, status }));
const summary = {
  origin: origin.origin,
  pagesChecked: pages.length,
  passed: pages.length - failures.length,
  failed: failures.length,
  marketSurfaces,
  slowest,
  failures,
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = failures.length > 0 ? 1 : 0;

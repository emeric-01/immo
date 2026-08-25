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
  const isPricePage = /^\/prix-m2\/[^/]+$/.test(pathname);
  const isAgencyPage = /^\/agence-immobiliere\/[^/]+$/.test(pathname);
  const isEstimationPage = /^\/estimation-immobiliere\/[^/]+$/.test(pathname);
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
  if (isPricePage && !response.body.includes("Évolution des prix")) issues.push("bloc d'évolution absent");

  return {
    durationMs: response.durationMs,
    finalUrl: response.finalUrl,
    issues,
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
const slowest = [...pages]
  .sort((left, right) => right.durationMs - left.durationMs)
  .slice(0, 10)
  .map(({ durationMs, pathname, status }) => ({ durationMs, pathname, status }));
const summary = {
  origin: origin.origin,
  pagesChecked: pages.length,
  passed: pages.length - failures.length,
  failed: failures.length,
  slowest,
  failures,
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = failures.length > 0 ? 1 : 0;

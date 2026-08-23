import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  METHODOLOGY_VERSION,
  calculateTrend,
  confidenceForCount,
  largestOuterRing,
  pointInGeometry,
  polygonLabelPoint,
  summarizeSales,
} from "./market-statistics.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const DVF_FIRST_YEAR = 2014;
const DVF_LAST_YEAR = 2025;
const CURRENT_WINDOW_YEARS = 5;
const SOURCE_RELEASE = "geo-dvf/latest + IGN/INSEE Contours IRIS 2026";
const IRIS_SOURCE_DATE = "2026-04-30";
const CACHE_DIR = path.join(tmpdir(), "jumelles-immo-dvf");
const cli = parseCli(process.argv.slice(2));

await loadEnvironment(path.join(PROJECT_ROOT, ".env.local"));
const cities = (await readLocalMarketCities()).filter((city) => !cli.city || city.slug === cli.city);
if (cities.length === 0) throw new Error(`Ville inconnue ou hors périmètre : ${cli.city}`);

const database = cli.persist ? getDatabaseConfig() : null;
await mkdir(CACHE_DIR, { recursive: true });
const run = database ? await createImportRun(database, cities) : null;
const results = [];
const errors = [];
let processedFiles = 0;

for (const city of cities) {
  try {
    const existingMarket = database ? await readExistingMarket(database, city.inseeCode) : null;
    const irisZones = await downloadIrisZones(city);
    const sales = [];

    for (const sourceCode of sourceCodesForCity(city)) {
      for (const year of years()) {
        const fileSales = await downloadAndParseDvf(city, sourceCode, year, irisZones);
        processedFiles += 1;
        sales.push(...fileSales);
      }
    }

    const snapshot = buildCitySnapshot(city, irisZones, sales, existingMarket, run?.id ?? null);
    results.push({
      city: city.name,
      insee: city.inseeCode,
      sales: sales.length,
      zones: irisZones.length,
      apartment: snapshot.marketData.apartment.averagePricePerM2,
      house: snapshot.marketData.house.averagePricePerM2,
    });

    if (database && run) {
      await persistCity(database, run.id, city, irisZones, sales, snapshot);
    }

    console.log(`[DVF] ${city.name}: ${sales.length} ventes, ${irisZones.length} zones IRIS`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({ city: city.slug, message });
    console.error(`[DVF] ${city.name}: ${message}`);
    if (cli.city) break;
  }
}

if (database && run) {
  await finishImportRun(database, run.id, results, errors, processedFiles);
}

console.table(results);
if (errors.length > 0) {
  console.error(JSON.stringify(errors, null, 2));
  process.exitCode = 1;
}

function parseCli(argumentsList) {
  const city = argumentsList.find((argument) => argument.startsWith("--city="))?.split("=")[1];
  return {
    city,
    persist: argumentsList.includes("--persist"),
    refreshDownloads: argumentsList.includes("--refresh-downloads"),
  };
}

function years() {
  return Array.from({ length: DVF_LAST_YEAR - DVF_FIRST_YEAR + 1 }, (_, index) => DVF_FIRST_YEAR + index);
}

async function loadEnvironment(filePath) {
  const contents = await readFile(filePath, "utf8").catch(() => "");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

async function readLocalMarketCities() {
  const contents = await readFile(path.join(PROJECT_ROOT, "src/lib/cities.ts"), "utf8");
  const pattern = /\{\s*slug: "([^"]+)",\s*name: "([^"]+)",\s*postalCode: "([^"]+)",\s*inseeCode: "([^"]+)",\s*department: "([^"]+)",\s*region: "([^"]+)",\s*latitude: ([\d.-]+),\s*longitude: ([\d.-]+),\s*nearbySlugs:/g;
  return [...contents.matchAll(pattern)]
    .map((match) => ({
      slug: match[1],
      name: match[2],
      postalCode: match[3],
      inseeCode: match[4],
      department: match[5],
      latitude: Number(match[7]),
      longitude: Number(match[8]),
    }))
    .filter((city) => ["Bouches-du-Rhone", "Var"].includes(city.department));
}

function sourceCodesForCity(city) {
  if (city.slug !== "marseille") return [city.inseeCode];
  return Array.from({ length: 16 }, (_, index) => `132${String(index + 1).padStart(2, "0")}`);
}

function getDatabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configuration Supabase absente.");
  return { url, key };
}

function databaseHeaders(database, prefer) {
  return {
    apikey: database.key,
    Authorization: `Bearer ${database.key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function databaseRequest(database, pathname, options = {}) {
  const { prefer, headers, ...fetchOptions } = options;
  const response = await fetch(`${database.url}/rest/v1/${pathname}`, {
    ...fetchOptions,
    headers: { ...databaseHeaders(database, prefer), ...headers },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

async function createImportRun(database, selectedCities) {
  const [row] = await databaseRequest(database, "dvf_import_runs", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      city_insee_codes: selectedCities.map((city) => city.inseeCode),
      source_release: SOURCE_RELEASE,
      source_years: years(),
    }),
  });
  return row;
}

async function finishImportRun(database, runId, successful, failed, downloadedFiles) {
  await databaseRequest(database, `dvf_import_runs?id=eq.${runId}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({
      comparable_sales: successful.reduce((total, city) => total + city.sales, 0),
      completed_at: new Date().toISOString(),
      downloaded_files: downloadedFiles,
      errors: failed,
      snapshot_count: successful.length,
      status: failed.length === 0 ? "success" : successful.length > 0 ? "partial" : "error",
    }),
  });
}

async function readExistingMarket(database, inseeCode) {
  const rows = await databaseRequest(
    database,
    `city_market_cache?insee_code=eq.${inseeCode}&select=market_data&limit=1`,
  );
  return rows?.[0]?.market_data ?? null;
}

async function downloadIrisZones(city) {
  const codes = sourceCodesForCity(city);
  const parameters = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: "2.0.0",
    REQUEST: "GetFeature",
    TYPENAMES: "STATISTICALUNITS.IRIS:contours_iris",
    OUTPUTFORMAT: "application/json",
    SRSNAME: "EPSG:4326",
    CQL_FILTER: `code_insee IN (${codes.map((code) => `'${code}'`).join(",")})`,
  });
  const response = await fetch(`https://data.geopf.fr/wfs/ows?${parameters}`);
  if (!response.ok) throw new Error(`Contours IRIS indisponibles (${response.status}).`);
  const collection = await response.json();
  return (collection.features ?? []).map((feature) => ({
    code: feature.properties.code_iris,
    name: titleCase(feature.properties.nom_iris),
    type: feature.properties.type_iris ?? null,
    geometry: feature.geometry,
    labelPoint: polygonLabelPoint(feature.geometry),
  }));
}

async function downloadAndParseDvf(city, sourceCode, year, irisZones) {
  const department = sourceCode.slice(0, 2);
  const sourceUrl = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/communes/${department}/${sourceCode}.csv`;
  const cachePath = path.join(CACHE_DIR, `${year}-${sourceCode}.csv`);
  let csv = cli.refreshDownloads ? null : await readFile(cachePath, "utf8").catch(() => null);

  if (csv === null) {
    const response = await fetch(sourceUrl);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`DVF ${year}/${sourceCode} indisponible (${response.status}).`);
    csv = await response.text();
    await writeFile(cachePath, csv);
  }

  const rows = parseCsv(csv);
  const grouped = new Map();
  for (const row of rows) {
    if (!row.id_mutation) continue;
    const group = grouped.get(row.id_mutation) ?? [];
    group.push(row);
    grouped.set(row.id_mutation, group);
  }

  return [...grouped.entries()].flatMap(([mutationId, mutationRows]) => {
    const sale = toComparableSale(city, mutationId, mutationRows, year, sourceUrl, irisZones);
    return sale ? [sale] : [];
  });
}

function parseCsv(contents) {
  const lines = contents.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function toComparableSale(city, mutationId, rows, year, sourceUrl, irisZones) {
  if (!rows.some((row) => row.nature_mutation === "Vente")) return null;
  const built = new Map();
  for (const row of rows) {
    if (!["Appartement", "Maison"].includes(row.type_local)) continue;
    const signature = [row.type_local, row.surface_reelle_bati, row.nombre_pieces_principales, row.id_parcelle].join("|");
    built.set(signature, row);
  }
  if (built.size !== 1) return null;

  const row = [...built.values()][0];
  const propertyType = row.type_local === "Appartement" ? "apartment" : "house";
  const salePrice = frenchNumber(row.valeur_fonciere);
  const builtAreaM2 = frenchNumber(row.surface_reelle_bati);
  const longitude = frenchNumber(row.longitude);
  const latitude = frenchNumber(row.latitude);
  const pricePerM2 = salePrice / builtAreaM2;
  const maximumArea = propertyType === "apartment" ? 500 : 1_000;

  if (!salePrice || !builtAreaM2 || !longitude || !latitude) return null;
  if (builtAreaM2 < 15 || builtAreaM2 > maximumArea) return null;
  if (salePrice < 10_000 || salePrice > 20_000_000) return null;
  if (pricePerM2 < 500 || pricePerM2 > 25_000) return null;

  const zone = irisZones.find((candidate) => pointInGeometry([longitude, latitude], candidate.geometry));
  const address = [row.adresse_numero, row.adresse_suffixe, titleCase(row.adresse_nom_voie)]
    .filter(Boolean)
    .join(" ") || city.name;

  return {
    mutationId,
    sourceYear: year,
    cityInseeCode: city.inseeCode,
    citySlug: city.slug,
    irisCode: zone?.code ?? null,
    saleDate: row.date_mutation,
    salePrice: Math.round(salePrice * 100) / 100,
    propertyType,
    builtAreaM2,
    rooms: integerOrNull(row.nombre_pieces_principales),
    landAreaM2: frenchNumber(rows.find((candidate) => candidate.surface_terrain)?.surface_terrain) || null,
    pricePerM2: Math.round(pricePerM2),
    addressLabel: address,
    postalCode: row.code_postal || city.postalCode,
    longitude,
    latitude,
    sourceUrl,
  };
}

function buildCitySnapshot(city, irisZones, sales, existingMarket, importRunId) {
  const latestYear = Math.max(...sales.map((sale) => sale.sourceYear), DVF_LAST_YEAR);
  const currentStartYear = latestYear - CURRENT_WINDOW_YEARS + 1;
  const currentSales = sales.filter((sale) => sale.sourceYear >= currentStartYear && sale.sourceYear <= latestYear);
  const apartment = propertyStat(sales, currentSales, "apartment", existingMarket?.apartment);
  const house = propertyStat(sales, currentSales, "house", existingMarket?.house);
  const historyWithCounts = years().map((year) => {
    const yearly = sales.filter((sale) => sale.sourceYear === year);
    const apartmentSummary = summarizeSales(yearly.filter((sale) => sale.propertyType === "apartment"));
    const houseSummary = summarizeSales(yearly.filter((sale) => sale.propertyType === "house"));
    return {
      period: String(year),
      apartment: apartmentSummary.medianPricePerM2 ?? 0,
      house: houseSummary.medianPricePerM2 ?? 0,
      apartmentCount: apartmentSummary.observations,
      houseCount: houseSummary.observations,
    };
  });
  const history = historyWithCounts.map(({ period, apartment: apartmentValue, house: houseValue }) => ({
    period,
    apartment: apartmentValue,
    house: houseValue,
  }));
  apartment.trend1Year = trendFromHistory(historyWithCounts, "apartment");
  house.trend1Year = trendFromHistory(historyWithCounts, "house");
  apartment.trendSource = apartment.trend1Year === 0 ? "unavailable" : "history";
  house.trendSource = house.trend1Year === 0 ? "unavailable" : "history";

  const zones = irisZones.map((zone) => {
    const zoneCurrent = currentSales.filter((sale) => sale.irisCode === zone.code);
    const zoneAll = sales.filter((sale) => sale.irisCode === zone.code);
    const apartmentZone = adaptiveZoneStat(zoneCurrent, zoneAll, "apartment", currentStartYear, latestYear);
    const houseZone = adaptiveZoneStat(zoneCurrent, zoneAll, "house", currentStartYear, latestYear);
    const combined = summarizeSales(zoneCurrent.length >= 3 ? zoneCurrent : zoneAll);
    return {
      id: zone.code,
      code: zone.code,
      name: zone.name,
      mapLabel: zone.name,
      includedNeighborhoods: [zone.name],
      pricePerM2: combined.medianPricePerM2 ?? Math.round((apartment.averagePricePerM2 + house.averagePricePerM2) / 2),
      color: "#c9895e",
      polygon: largestOuterRing(zone.geometry),
      labelPoint: zone.labelPoint,
      apartment: apartmentZone,
      house: houseZone,
    };
  });

  const latestSales = [...sales]
    .sort((left, right) => right.saleDate.localeCompare(left.saleDate))
    .slice(0, 20)
    .map((sale) => ({
      id: sale.mutationId,
      label: sale.addressLabel,
      latitude: sale.latitude,
      longitude: sale.longitude,
      price: sale.salePrice,
      pricePerM2: sale.pricePerM2,
      propertyType: sale.propertyType === "apartment" ? "Appartement" : "Maison",
      rooms: sale.rooms ?? 0,
      soldAt: sale.saleDate,
      surfaceM2: sale.builtAreaM2,
    }));
  const latestSaleAt = latestSales[0]?.soldAt ?? null;
  const currentComparableCount = apartment.observations + house.observations;
  const marketData = {
    source: "dvf",
    updatedAt: new Date().toISOString().slice(0, 10),
    apartment,
    house,
    history,
    zones,
    salePoints: latestSales,
    transactionCount: currentComparableCount,
    saleDurationDays: existingMarket?.saleDurationDays,
    neighborhoods: zones
      .filter((zone) => zone.pricePerM2 > 0)
      .map((zone) => ({ name: zone.name, pricePerM2: zone.pricePerM2 })),
    expensiveStreets: [],
    affordableStreets: [],
    localInfo: existingMarket?.localInfo,
  };
  const auditData = {
    methodologyVersion: METHODOLOGY_VERSION,
    currentWindow: `${currentStartYear}-${latestYear}`,
    extendedWindow: `${DVF_FIRST_YEAR}-${latestYear}`,
    candidateSales: sales.length,
    currentComparableSales: currentComparableCount,
    irisZones: zones.length,
    sourceCodes: sourceCodesForCity(city),
  };

  return {
    importRunId,
    marketData,
    auditData,
    latestSaleAt,
    observedFrom: `${DVF_FIRST_YEAR}-01-01`,
    observedTo: `${latestYear}-12-31`,
    transactionCount: currentComparableCount,
  };
}

function propertyStat(allSales, currentSales, propertyType, fallback) {
  const current = summarizeSales(currentSales.filter((sale) => sale.propertyType === propertyType));
  const extended = current.observations >= 3
    ? current
    : summarizeSales(allSales.filter((sale) => sale.propertyType === propertyType));
  const central = extended.medianPricePerM2 ?? fallback?.averagePricePerM2 ?? 0;
  const low = extended.p25PricePerM2 ?? fallback?.lowPricePerM2 ?? central;
  const high = extended.p75PricePerM2 ?? fallback?.highPricePerM2 ?? central;
  return {
    averagePricePerM2: central,
    lowPricePerM2: low,
    highPricePerM2: high,
    confidenceScore: confidenceForCount(extended.observations),
    observations: extended.observations,
    trend1Year: 0,
    rangeSource: extended.medianPricePerM2 ? "transactions" : "estimated",
    trendSource: "unavailable",
  };
}

function adaptiveZoneStat(currentSales, allSales, propertyType, currentStartYear, latestYear) {
  const current = summarizeSales(currentSales.filter((sale) => sale.propertyType === propertyType));
  if (current.observations >= 3) return { ...current, observedPeriod: `${currentStartYear}–${latestYear}` };
  const extended = summarizeSales(allSales.filter((sale) => sale.propertyType === propertyType));
  return { ...extended, observedPeriod: `${DVF_FIRST_YEAR}–${latestYear}` };
}

function trendFromHistory(history, propertyType) {
  const available = history.filter((point) => point[propertyType] > 0 && point[`${propertyType}Count`] >= 3);
  const [previous, current] = available.slice(-2);
  if (!previous || !current || Number(current.period) - Number(previous.period) !== 1) return 0;
  return calculateTrend(previous[propertyType], current[propertyType]);
}

async function persistCity(database, runId, city, irisZones, sales, snapshot) {
  const zoneRows = irisZones.map((zone) => ({
    code_iris: zone.code,
    city_insee_code: city.inseeCode,
    city_slug: city.slug,
    city_name: city.name,
    iris_name: zone.name,
    iris_type: zone.type,
    geometry: zone.geometry,
    label_longitude: zone.labelPoint[0],
    label_latitude: zone.labelPoint[1],
    source_updated_at: IRIS_SOURCE_DATE,
    updated_at: new Date().toISOString(),
  }));
  await upsertBatches(database, "dvf_iris_zones", "code_iris", zoneRows);

  const saleRows = sales.map((sale) => ({
    mutation_id: sale.mutationId,
    source_year: sale.sourceYear,
    city_insee_code: sale.cityInseeCode,
    city_slug: sale.citySlug,
    iris_code: sale.irisCode,
    sale_date: sale.saleDate,
    sale_price: sale.salePrice,
    property_type: sale.propertyType,
    built_area_m2: sale.builtAreaM2,
    rooms: sale.rooms,
    land_area_m2: sale.landAreaM2,
    address_label: sale.addressLabel,
    postal_code: sale.postalCode,
    longitude: sale.longitude,
    latitude: sale.latitude,
    source_url: sale.sourceUrl,
    import_run_id: runId,
    updated_at: new Date().toISOString(),
  }));
  await upsertBatches(database, "dvf_comparable_sales", "mutation_id", saleRows, 400);

  for (const year of years()) {
    await databaseRequest(
      database,
      `dvf_comparable_sales?city_insee_code=eq.${city.inseeCode}&source_year=eq.${year}&import_run_id=neq.${runId}`,
      { method: "DELETE", prefer: "return=minimal" },
    );
  }

  await databaseRequest(database, "dvf_city_market_snapshots?on_conflict=city_insee_code", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({
      city_insee_code: city.inseeCode,
      city_slug: city.slug,
      methodology_version: METHODOLOGY_VERSION,
      observed_from: snapshot.observedFrom,
      observed_to: snapshot.observedTo,
      latest_sale_at: snapshot.latestSaleAt,
      source_release: SOURCE_RELEASE,
      transaction_count: snapshot.transactionCount,
      market_data: snapshot.marketData,
      audit_data: snapshot.auditData,
      computed_at: new Date().toISOString(),
      import_run_id: runId,
    }),
  });
  await databaseRequest(database, "city_market_cache?on_conflict=insee_code", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({
      insee_code: city.inseeCode,
      city_slug: city.slug,
      market_data: snapshot.marketData,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
}

async function upsertBatches(database, table, conflictColumn, rows, batchSize = 100) {
  for (let index = 0; index < rows.length; index += batchSize) {
    await databaseRequest(database, `${table}?on_conflict=${conflictColumn}`, {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(rows.slice(index, index + batchSize)),
    });
  }
}

function frenchNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function integerOrNull(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCase(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'’-])([\p{L}])/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("fr-FR")}`);
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  METHODOLOGY_VERSION,
  buildAnnualPriceHistory,
  calculateLatestAnnualTrend,
  confidenceForCount,
  inspectHistoryCoverage,
  largestOuterRing,
  mergeStoredAndDvfHistory,
  pointInGeometry,
  polygonLabelPoint,
  summarizeSales,
} from "./market-statistics.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
// Permanent product contract: see docs/dvf-market-data.md. Do not shorten the
// history or replace missing periods with zero/interpolated values.
// The rolling geo-dvf "latest" archive currently exposes commune files from
// 2021 onward. Older paths return 404 and must never become zero-price points.
const DVF_FIRST_YEAR = 2021;
const DVF_LAST_YEAR = 2025;
const HISTORY_FIRST_YEAR = 2014;
const CURRENT_WINDOW_YEARS = 5;
const SOURCE_RELEASE = "geo-dvf/latest + historique Immo Data stocké + IGN/INSEE Contours IRIS 2026 + IGN BD TOPO V3";
const IRIS_SOURCE_DATE = "2026-04-30";
const HABITATION_SOURCE = "IGN BD TOPO V3 · zone d’habitation";
const HABITATION_PAGE_SIZE = 1_000;
const CACHE_DIR = path.join(tmpdir(), "jumelles-immo-dvf");
const DEFAULT_STAGE_DIR = path.join(PROJECT_ROOT, ".local", "dvf-market-staging");
const IRIS_DISPLAY_NAME_OVERRIDES = new Map([
  ["130050705", "Beaudinard"],
]);
const cli = parseCli(process.argv.slice(2));

await loadEnvironment(path.join(PROJECT_ROOT, ".env.local"));
const cities = (await readLocalMarketCities()).filter((city) => !cli.city || city.slug === cli.city);
if (cities.length === 0) throw new Error(`Ville inconnue ou hors périmètre : ${cli.city}`);

const database = getDatabaseConfig();
await mkdir(CACHE_DIR, { recursive: true });
if (cli.stage) await mkdir(cli.stageDir, { recursive: true });
if (cli.persistStaged) await validateStagedImport(cities);
const run = cli.persist || cli.persistStaged ? await createImportRun(database, cities) : null;
const results = [];
const errors = [];
let processedFiles = 0;

for (const city of cities) {
  try {
    const existingMarket = await readExistingMarket(database, city.inseeCode);
    const staged = cli.persistStaged ? await readStagedCity(city) : null;
    const irisZones = staged?.irisZones ?? await downloadIrisZones(city);
    const habitationNames = staged?.habitationNames ?? await downloadHabitationNames(city, irisZones);
    if (!staged) enrichIrisZoneNames(irisZones, habitationNames);
    const collectedSales = staged?.sales ?? [];

    if (!staged) {
      for (const sourceCode of sourceCodesForCity(city)) {
        for (const year of years()) {
          const fileSales = await downloadAndParseDvf(city, sourceCode, year, irisZones);
          processedFiles += 1;
          collectedSales.push(...fileSales);
        }
      }
    }

    const sales = dedupeComparableSales(collectedSales);
    const snapshot = buildCitySnapshot(city, irisZones, sales, existingMarket, run?.id ?? null);
    results.push({
      city: city.name,
      insee: city.inseeCode,
      sales: sales.length,
      zones: irisZones.length,
      neighborhoodNames: habitationNames.length,
      apartment: snapshot.marketData.apartment.averagePricePerM2,
      house: snapshot.marketData.house.averagePricePerM2,
    });

    if (database && run) {
      await persistCity(database, run.id, city, irisZones, sales, snapshot);
    }
    if (cli.stage) {
      await stageCity(city, irisZones, habitationNames, sales, snapshot);
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
if (cli.stage) await writeStageManifest(results, errors);

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
    persistStaged: argumentsList.includes("--persist-staged"),
    stage: argumentsList.includes("--stage"),
    stageDir: path.resolve(
      argumentsList.find((argument) => argument.startsWith("--stage-dir="))?.split("=")[1]
        ?? DEFAULT_STAGE_DIR,
    ),
    refreshDownloads: argumentsList.includes("--refresh-downloads"),
  };
}

function years() {
  return Array.from({ length: DVF_LAST_YEAR - DVF_FIRST_YEAR + 1 }, (_, index) => DVF_FIRST_YEAR + index);
}

function historyYears() {
  return Array.from(
    { length: DVF_LAST_YEAR - HISTORY_FIRST_YEAR + 1 },
    (_, index) => HISTORY_FIRST_YEAR + index,
  );
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
  if (!url || !key) {
    throw new Error(
      "Configuration Supabase absente : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
    );
  }
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
  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${responseBody}`);
  }
  return responseBody ? JSON.parse(responseBody) : null;
}

async function createImportRun(database, selectedCities) {
  const [row] = await databaseRequest(database, "dvf_import_runs", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      city_insee_codes: selectedCities.map((city) => city.inseeCode),
      source_release: SOURCE_RELEASE,
      source_years: historyYears(),
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
    officialName: titleCase(feature.properties.nom_iris),
    name: IRIS_DISPLAY_NAME_OVERRIDES.get(feature.properties.code_iris)
      ?? titleCase(feature.properties.nom_iris),
    type: feature.properties.type_iris ?? null,
    geometry: feature.geometry,
    labelPoint: polygonLabelPoint(feature.geometry),
    neighborhoodNames: [],
    featuredNeighborhoodNames: [],
    namingSources: [
      {
        label: "Contours IRIS INSEE/IGN",
        url: "https://geoservices.ign.fr/contoursiris",
      },
    ],
  }));
}

async function downloadHabitationNames(city, irisZones) {
  const cachePath = path.join(CACHE_DIR, `habitation-${city.slug}.json`);
  if (!cli.refreshDownloads) {
    const cached = await readFile(cachePath, "utf8").catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  const codes = sourceCodesForCity(city);
  const names = [];
  let startIndex = 0;
  let matched = Number.POSITIVE_INFINITY;

  while (startIndex < matched) {
    const parameters = new URLSearchParams({
      SERVICE: "WFS",
      VERSION: "2.0.0",
      REQUEST: "GetFeature",
      TYPENAMES: "BDTOPO_V3:zone_d_habitation",
      OUTPUTFORMAT: "application/json",
      SRSNAME: "EPSG:4326",
      CQL_FILTER: `insee_commune IN (${codes.map((code) => `'${code}'`).join(",")})`,
      COUNT: String(HABITATION_PAGE_SIZE),
      STARTINDEX: String(startIndex),
    });
    const response = await fetch(`https://data.geopf.fr/wfs/ows?${parameters}`);
    if (!response.ok) throw new Error(`Noms de quartiers IGN indisponibles (${response.status}).`);
    const collection = await response.json();
    const features = collection.features ?? [];
    matched = Number(collection.numberMatched ?? features.length);

    for (const feature of features) {
      const toponym = titleCase(feature.properties?.toponyme);
      if (!toponym || !feature.geometry || feature.properties?.etat_de_l_objet === "Détruit") continue;
      const labelPoint = polygonLabelPoint(feature.geometry);
      const iris = irisZones.find((zone) => pointInGeometry(labelPoint, zone.geometry));
      if (!iris) continue;
      names.push({
        id: feature.properties?.cleabs ?? feature.id,
        irisCode: iris.code,
        name: toponym,
        nature: feature.properties?.nature ?? null,
        detailedNature: feature.properties?.nature_detaillee ?? null,
        status: feature.properties?.statut_du_toponyme ?? null,
        importance: integerOrNull(feature.properties?.importance),
        fictitiousGeometry: Boolean(feature.properties?.fictif),
        labelPoint,
        source: HABITATION_SOURCE,
      });
    }

    if (features.length < HABITATION_PAGE_SIZE) break;
    startIndex += features.length;
  }

  const unique = deduplicateHabitationNames(names);
  await writeFile(cachePath, JSON.stringify(unique));
  return unique;
}

function deduplicateHabitationNames(names) {
  const unique = new Map();
  for (const name of names) {
    const key = `${name.irisCode}:${normalizePlaceName(name.name)}`;
    const existing = unique.get(key);
    if (!existing || habitationNameScore(name) > habitationNameScore(existing)) unique.set(key, name);
  }
  return [...unique.values()].sort((left, right) =>
    left.irisCode.localeCompare(right.irisCode)
    || habitationNameScore(right) - habitationNameScore(left)
    || left.name.localeCompare(right.name, "fr"),
  );
}

function enrichIrisZoneNames(irisZones, habitationNames) {
  for (const zone of irisZones) {
    const names = habitationNames.filter((place) => place.irisCode === zone.code);
    zone.neighborhoodNames = names.map((place) => place.name);
    zone.featuredNeighborhoodNames = names
      .filter(isSuitablePublicNeighborhoodName)
      .slice(0, 6)
      .map((place) => place.name);
    zone.namingSources = [
      ...zone.namingSources,
      ...(names.length > 0
        ? [{ label: HABITATION_SOURCE, url: "https://geoservices.ign.fr/bdtopo" }]
        : []),
    ];
  }
}

function isSuitablePublicNeighborhoodName(place) {
  if (place.detailedNature === "Résidence") return false;
  if (place.nature === "Quartier") return true;
  if (place.nature !== "Lieu-dit habité") return false;
  return place.status === "Validé" || (place.importance !== null && place.importance <= 4);
}

function habitationNameScore(place) {
  const natureScore = place.detailedNature === "Quartier urbain"
    ? 100
    : place.detailedNature === "Lotissement"
      ? 85
      : place.nature === "Quartier"
        ? 75
        : place.nature === "Lieu-dit habité"
          ? 60
          : 20;
  const statusScore = place.status === "Validé" ? 20 : place.status === "Collecté" ? 8 : 0;
  const importanceScore = place.importance === null ? 0 : Math.max(0, 7 - place.importance) * 3;
  return natureScore + statusScore + importanceScore + (place.fictitiousGeometry ? 0 : 10);
}

function normalizePlaceName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[^a-z0-9]/g, "");
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
  const historyWithCounts = buildAnnualPriceHistory(sales, years());
  const dvfHistory = historyWithCounts
    .map(({ period, apartment: apartmentValue, house: houseValue }) => ({
      period,
      apartment: apartmentValue,
      house: houseValue,
    }));
  const storedHistory = existingMarket?.source === "immo-data"
    || existingMarket?.historySource === "immo-data-dvf"
    ? existingMarket.history
    : [];
  const history = mergeStoredAndDvfHistory(storedHistory, dvfHistory, DVF_FIRST_YEAR);
  const historyCoverage = inspectHistoryCoverage(history, HISTORY_FIRST_YEAR, DVF_LAST_YEAR);
  if (historyCoverage.status === "partial") {
    const missing = [
      historyCoverage.missingApartmentPeriods.length
        ? `appartements (${historyCoverage.missingApartmentPeriods.join(", ")})`
        : null,
      historyCoverage.missingHousePeriods.length
        ? `maisons (${historyCoverage.missingHousePeriods.join(", ")})`
        : null,
    ].filter(Boolean).join(" ; ");
    throw new Error(
      `Historique incomplet pour ${city.name}: ${missing}. Publication interrompue ; vérifiez la donnée stockée avant de continuer.`,
    );
  }
  const hasStoredHistory = history.some((point) => Number.parseInt(point.period.slice(0, 4), 10) < DVF_FIRST_YEAR);
  const apartmentTrend = calculateLatestAnnualTrend(history, "apartment");
  const houseTrend = calculateLatestAnnualTrend(history, "house");
  apartment.trend1Year = apartmentTrend ?? 0;
  house.trend1Year = houseTrend ?? 0;
  apartment.trendSource = apartmentTrend === null ? "unavailable" : "history";
  house.trendSource = houseTrend === null ? "unavailable" : "history";

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
      officialName: zone.officialName,
      includedNeighborhoods: zone.featuredNeighborhoodNames.length > 0
        ? zone.featuredNeighborhoodNames
        : [zone.name],
      allNeighborhoodNames: zone.neighborhoodNames,
      namingSources: zone.namingSources,
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
    historySource: hasStoredHistory ? "immo-data-dvf" : "dvf",
    historyCoverage,
    updatedAt: new Date().toISOString().slice(0, 10),
    apartment,
    house,
    history,
    zones,
    salePoints: latestSales,
    transactionCount: currentComparableCount,
    saleDurationDays: existingMarket?.saleDurationDays,
    saleDurationSource: existingMarket?.saleDurationDays
      ? existingMarket.saleDurationSource ?? "immo-data"
      : undefined,
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
    extendedWindow: `${history[0]?.period ?? DVF_FIRST_YEAR}-${latestYear}`,
    historySource: hasStoredHistory
      ? "Immo Data stocké + geo-dvf/latest, avec complément Immo Data si DVF est insuffisant"
      : "geo-dvf/latest",
    immoDataFallbackApartmentPeriods: history
      .filter((point) => Number(point.period) >= DVF_FIRST_YEAR && point.apartmentSource === "immo-data")
      .map((point) => point.period),
    immoDataFallbackHousePeriods: history
      .filter((point) => Number(point.period) >= DVF_FIRST_YEAR && point.houseSource === "immo-data")
      .map((point) => point.period),
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
    observedFrom: `${history[0]?.period ?? DVF_FIRST_YEAR}-01-01`,
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

async function persistCity(database, runId, city, irisZones, sales, snapshot) {
  const zoneRows = irisZones.map((zone) => ({
    code_iris: zone.code,
    city_insee_code: city.inseeCode,
    city_slug: city.slug,
    city_name: city.name,
    iris_name: zone.name,
    official_name: zone.officialName,
    display_name: zone.name,
    neighborhood_names: zone.neighborhoodNames,
    naming_sources: zone.namingSources,
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
  await upsertBatches(
    database,
    "dvf_comparable_sales",
    "mutation_id,city_insee_code",
    saleRows,
    400,
  );

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

async function stageCity(city, irisZones, habitationNames, sales, snapshot) {
  const cityDirectory = path.join(cli.stageDir, city.slug);
  await mkdir(cityDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(cityDirectory, "market-snapshot.json"),
      JSON.stringify({ city, ...snapshot }, null, 2),
    ),
    writeFile(
      path.join(cityDirectory, "iris-zones.json"),
      JSON.stringify(irisZones, null, 2),
    ),
    writeFile(
      path.join(cityDirectory, "neighborhood-names.json"),
      JSON.stringify(habitationNames, null, 2),
    ),
    writeFile(
      path.join(cityDirectory, "comparable-sales.ndjson"),
      `${sales.map((sale) => JSON.stringify(sale)).join("\n")}\n`,
    ),
  ]);
}

async function readStagedCity(city) {
  const cityDirectory = path.join(cli.stageDir, city.slug);
  const [snapshotFile, irisFile, namesFile, salesFile] = await Promise.all([
    readFile(path.join(cityDirectory, "market-snapshot.json"), "utf8"),
    readFile(path.join(cityDirectory, "iris-zones.json"), "utf8"),
    readFile(path.join(cityDirectory, "neighborhood-names.json"), "utf8"),
    readFile(path.join(cityDirectory, "comparable-sales.ndjson"), "utf8"),
  ]);
  const snapshotDocument = JSON.parse(snapshotFile);
  return {
    snapshot: {
      importRunId: null,
      marketData: snapshotDocument.marketData,
      auditData: snapshotDocument.auditData,
      latestSaleAt: snapshotDocument.latestSaleAt,
      observedFrom: snapshotDocument.observedFrom,
      observedTo: snapshotDocument.observedTo,
      transactionCount: snapshotDocument.transactionCount,
    },
    irisZones: JSON.parse(irisFile),
    habitationNames: JSON.parse(namesFile),
    sales: salesFile.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)),
  };
}

async function validateStagedImport(selectedCities) {
  const manifestPath = path.join(cli.stageDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const stagedCodes = new Set((manifest.cities ?? []).map((city) => city.insee));
  const missingCities = selectedCities.filter((city) => !stagedCodes.has(city.inseeCode));

  if ((manifest.errors ?? []).length > 0) {
    throw new Error(`Le staging contient ${manifest.errors.length} erreur(s) et ne peut pas être publié.`);
  }
  if (manifest.methodologyVersion !== METHODOLOGY_VERSION) {
    throw new Error(
      `Méthodologie de staging incompatible : ${manifest.methodologyVersion ?? "absente"}.`,
    );
  }
  if (missingCities.length > 0) {
    throw new Error(
      `Ville(s) absente(s) du staging : ${missingCities.map((city) => city.slug).join(", ")}.`,
    );
  }
}

function dedupeComparableSales(sales) {
  const uniqueSales = new Map();
  for (const sale of sales) {
    const existing = uniqueSales.get(sale.mutationId);
    if (!existing || (!existing.irisCode && sale.irisCode)) {
      uniqueSales.set(sale.mutationId, sale);
    }
  }
  return [...uniqueSales.values()];
}

async function writeStageManifest(results, errors) {
  await writeFile(
    path.join(cli.stageDir, "manifest.json"),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      methodologyVersion: METHODOLOGY_VERSION,
      sourceRelease: SOURCE_RELEASE,
      sourceYears: years(),
      cities: results,
      errors,
      totals: {
        cities: results.length,
        comparableSales: results.reduce((total, city) => total + city.sales, 0),
        irisZones: results.reduce((total, city) => total + city.zones, 0),
        neighborhoodNames: results.reduce((total, city) => total + city.neighborhoodNames, 0),
      },
    }, null, 2),
  );
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

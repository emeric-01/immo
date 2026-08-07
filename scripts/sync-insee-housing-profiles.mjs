#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const csvPath = process.argv[2];
if (!csvPath) throw new Error("Usage: node --env-file=.env.local scripts/sync-insee-housing-profiles.mjs <fichier INSEE CSV>");

const citiesSource = await readFile(new URL("../src/lib/cities.ts", import.meta.url), "utf8");
const cities = [...citiesSource.matchAll(/name:\s*"([^"]+)"[\s\S]*?inseeCode:\s*"(\d{5})"/g)].map((match) => ({ name: match[1], code: match[2] }));
const wantedCodes = new Set(cities.flatMap(({ code }) => code === "13055" ? Array.from({ length: 16 }, (_, index) => `132${String(index + 1).padStart(2, "0")}`) : [code]));
const csv = await readFile(csvPath, "utf8");
const lines = csv.split(/\r?\n/);
const header = lines.shift().split(";");
const index = Object.fromEntries(header.map((name, position) => [name.replace(/^\uFEFF/, ""), position]));
const fields = ["P22_LOG", "P22_RP", "P22_RSECOCC", "P22_LOGVAC", "P22_MAISON", "P22_APPART", "P22_RP_PROP", "P22_RP_LOC", "P22_RP_GRAT", "P22_RP_1P", "P22_RP_2P", "P22_RP_3P", "P22_RP_4P", "P22_RP_5PP", "P22_RP_M30M2", "P22_RP_3040M2", "P22_RP_4060M2", "P22_RP_6080M2", "P22_RP_80100M2", "P22_RP_100120M2", "P22_RP_120M2P", "P22_RP_ACH1919", "P22_RP_ACH1945", "P22_RP_ACH1970", "P22_RP_ACH1990", "P22_RP_ACH2005", "P22_RP_ACH2019", "P22_MEN_ANEM0002", "P22_MEN_ANEM0204", "P22_MEN_ANEM0509", "P22_MEN_ANEM10P"];
const totals = new Map();
for (const line of lines) {
  if (!line) continue;
  const columns = line.split(";");
  const code = columns[index.COM];
  if (!wantedCodes.has(code)) continue;
  const targetCode = code.startsWith("132") ? "13055" : code;
  const total = totals.get(targetCode) ?? Object.fromEntries(fields.map((field) => [field, 0]));
  for (const field of fields) total[field] += Number((columns[index[field]] ?? "0").replace(",", ".")) || 0;
  totals.set(targetCode, total);
}

const dist = (labels, values) => labels.map((label, i) => ({ label, value: Math.round(values[i] ?? 0) }));
const sourceUrl = "https://www.insee.fr/fr/statistiques/8647012";
const rows = cities.flatMap(({ name, code }) => {
  const t = totals.get(code);
  if (!t) return [];
  const payload = {
    cityName: name, inseeCode: code, vintage: 2022, sourceUrl, totalHousing: Math.round(t.P22_LOG),
    housingTypes: dist(["Maisons", "Appartements"], [t.P22_MAISON, t.P22_APPART]),
    occupancy: dist(["Résidences principales", "Résidences secondaires", "Logements vacants"], [t.P22_RP, t.P22_RSECOCC, t.P22_LOGVAC]),
    tenure: dist(["Propriétaires", "Locataires", "Logés gratuitement"], [t.P22_RP_PROP, t.P22_RP_LOC, t.P22_RP_GRAT]),
    rooms: dist(["1 pièce", "2 pièces", "3 pièces", "4 pièces", "5 pièces ou +"], [t.P22_RP_1P, t.P22_RP_2P, t.P22_RP_3P, t.P22_RP_4P, t.P22_RP_5PP]),
    surfaces: dist(["< 30 m²", "30-40 m²", "40-60 m²", "60-80 m²", "80-100 m²", "100-120 m²", "> 120 m²"], [t.P22_RP_M30M2, t.P22_RP_3040M2, t.P22_RP_4060M2, t.P22_RP_6080M2, t.P22_RP_80100M2, t.P22_RP_100120M2, t.P22_RP_120M2P]),
    construction: dist(["Avant 1919", "1919-1945", "1946-1970", "1971-1990", "1991-2005", "2006-2019"], [t.P22_RP_ACH1919, t.P22_RP_ACH1945, t.P22_RP_ACH1970, t.P22_RP_ACH1990, t.P22_RP_ACH2005, t.P22_RP_ACH2019]),
    moveIn: dist(["< 2 ans", "2-4 ans", "5-9 ans", "10 ans ou +"], [t.P22_MEN_ANEM0002, t.P22_MEN_ANEM0204, t.P22_MEN_ANEM0509, t.P22_MEN_ANEM10P]),
  };
  return [{ insee_code: code, city_name: name, vintage: 2022, source_url: sourceUrl, payload, synced_at: new Date().toISOString() }];
});

await mkdir(path.resolve("tmp/insee"), { recursive: true });
await writeFile(path.resolve("tmp/insee/housing-profiles.json"), JSON.stringify(rows, null, 2));
console.log(`${rows.length} profils INSEE préparés.`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const response = await fetch(`${url}/rest/v1/insee_housing_profiles?on_conflict=insee_code`, {
    method: "POST", body: JSON.stringify(rows),
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
  });
  if (!response.ok) throw new Error(`Synchronisation Supabase impossible (${response.status}) : ${await response.text()}`);
  console.log("Profils synchronisés dans Supabase.");
}

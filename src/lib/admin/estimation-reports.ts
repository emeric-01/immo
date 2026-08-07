import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { AdminSession } from "@/lib/admin/auth";
import type { AdminEstimation } from "@/lib/admin/estimations";
import type { InseeHousingProfile } from "@/lib/insee-housing";

export type EstimationReportSnapshot = {
  id: string;
  estimation_id: string;
  version: number;
  created_at: string;
  pdf_storage_path: string;
  pdf_sha256: string;
};

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Configuration Supabase manquante");
  return { url, key };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

export async function listEstimationReportSnapshots(estimationId: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_report_snapshots?estimation_id=eq.${encodeURIComponent(estimationId)}&select=id,estimation_id,version,created_at,pdf_storage_path,pdf_sha256&order=version.desc`, { cache: "no-store", headers: headers(key) });
  if (!response.ok) return [];
  return response.json() as Promise<EstimationReportSnapshot[]>;
}

export async function saveEstimationReportSnapshot(args: {
  estimation: AdminEstimation;
  inseeProfile: InseeHousingProfile | null;
  pdf: Buffer;
  session: AdminSession;
  version: number;
}) {
  const { url, key } = config();
  const id = randomUUID();
  const path = `${args.estimation.id}/v${args.version}-${id}.pdf`;
  const upload = await fetch(`${url}/storage/v1/object/estimation-reports/${path}`, {
    body: new Uint8Array(args.pdf), method: "POST",
    headers: headers(key, { "Content-Type": "application/pdf", "x-upsert": "false" }),
  });
  if (!upload.ok) throw new Error(`Archivage PDF impossible (${upload.status}) : ${await upload.text()}`);

  const row = {
    id,
    estimation_id: args.estimation.id,
    version: args.version,
    created_by_admin_user_id: args.session.role === "bootstrap" ? null : args.session.id,
    input_payload: args.estimation.input_payload,
    generated_result_payload: args.estimation.generated_result_payload ?? args.estimation.result_payload,
    report_result_payload: args.estimation.result_payload,
    insee_profile: args.inseeProfile,
    low_price: args.estimation.low_price,
    median_price: args.estimation.median_price,
    high_price: args.estimation.high_price,
    price_per_m2: args.estimation.price_per_m2,
    pdf_storage_path: path,
    pdf_sha256: createHash("sha256").update(args.pdf).digest("hex"),
  };
  const insert = await fetch(`${url}/rest/v1/estimation_report_snapshots`, {
    body: JSON.stringify(row), method: "POST",
    headers: headers(key, { "Content-Type": "application/json", Prefer: "return=representation" }),
  });
  if (!insert.ok) {
    await fetch(`${url}/storage/v1/object/estimation-reports/${path}`, { method: "DELETE", headers: headers(key) });
    throw new Error(`Enregistrement de la version impossible (${insert.status}) : ${await insert.text()}`);
  }
  return (await insert.json() as EstimationReportSnapshot[])[0];
}

export async function downloadEstimationReportSnapshot(snapshot: EstimationReportSnapshot) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/estimation-reports/${snapshot.pdf_storage_path}`, { cache: "no-store", headers: headers(key) });
  if (!response.ok) throw new Error(`Téléchargement du PDF impossible (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

export function nextReportVersion(rows: EstimationReportSnapshot[]) {
  return Math.max(0, ...rows.map((row) => row.version)) + 1;
}

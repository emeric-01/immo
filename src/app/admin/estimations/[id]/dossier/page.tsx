import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getAdminEstimation } from "@/lib/admin/estimations";
import { getWorkspaceBySourceEstimation } from "@/lib/admin/estimation-workspaces";
import { AgentWorkspaceEditor } from "./AgentWorkspaceEditor";
import { listEstimationReportSnapshots } from "@/lib/admin/estimation-reports";
import { getInseeHousingProfile } from "@/lib/insee-housing";
import { getCityByMarketIdentifier } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { selectWidestCityPriceHistory } from "@/lib/price-history";

export const metadata: Metadata = { title: "Dossier d’estimation professionnel | Admin" };
export const dynamic = "force-dynamic";

export default async function EstimationWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession(); await requireAdminPermission(session, "estimations:read");
  const { id } = await params;
  const [sourceState, workspace] = await Promise.all([getAdminEstimation(id, session), getWorkspaceBySourceEstimation(id, session)]);
  if (sourceState.status !== "ready" || !sourceState.data || !workspace) return <main>Le dossier professionnel n’existe pas encore.</main>;
  const source = sourceState.data;
  const generated = source.generated_result_payload ?? source.result_payload;
  const city = getCityByMarketIdentifier({ inseeCode: source.input_payload.selectedAddress?.inseeCode, name: source.input_payload.selectedAddress?.cityName });
  const [snapshots, inseeProfile, cachedMarket] = await Promise.all([
    listEstimationReportSnapshots(source.id, workspace.id),
    getInseeHousingProfile(source.input_payload.selectedAddress?.inseeCode),
    city ? readCityMarketCache(city) : Promise.resolve(null),
  ]);
  const marketHistory = selectWidestCityPriceHistory(generated.market?.cityPriceHistory, cachedMarket?.data.history);
  return <AgentWorkspaceEditor estimationId={source.id} initial={workspace} inseeProfile={inseeProfile} mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ""} marketHistory={marketHistory} original={{ high: source.generated_high_price ?? generated.highPrice, low: source.generated_low_price ?? generated.lowPrice, median: source.generated_median_price ?? generated.medianPrice, pricePerM2: generated.pricePerM2 }} snapshots={snapshots} />;
}

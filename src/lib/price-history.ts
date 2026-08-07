import type { CityPriceHistoryPoint } from "./city-market-data";

export function selectWidestCityPriceHistory(
  ...candidates: Array<CityPriceHistoryPoint[] | null | undefined>
): CityPriceHistoryPoint[] {
  const histories = candidates
    .map(normalizeCityPriceHistory)
    .filter((history) => history.length > 1);

  return histories.sort((left, right) => {
    const oldest = periodKey(left[0].period) - periodKey(right[0].period);
    if (oldest !== 0) return oldest;
    const newest = periodKey(right.at(-1)!.period) - periodKey(left.at(-1)!.period);
    if (newest !== 0) return newest;
    return right.length - left.length;
  })[0] ?? [];
}

export function historyDurationLabel(firstPeriod: string, lastPeriod: string) {
  const start = periodParts(firstPeriod);
  const end = periodParts(lastPeriod);
  if (!start || !end) return "historique disponible";
  const months = Math.max(0, (end.year - start.year) * 12 + end.month - start.month);
  if (months < 12) return `${Math.max(1, months)} mois d’historique`;
  const years = months / 12;
  return `${years.toLocaleString("fr-FR", { maximumFractionDigits: years % 1 ? 1 : 0 })} ans d’historique`;
}

function normalizeCityPriceHistory(history: CityPriceHistoryPoint[] | null | undefined) {
  const byPeriod = new Map<string, CityPriceHistoryPoint>();
  for (const point of history ?? []) {
    if (!point?.period || (!isPositive(point.apartment) && !isPositive(point.house))) continue;
    byPeriod.set(point.period, point);
  }
  return Array.from(byPeriod.values()).sort((left, right) => periodKey(left.period) - periodKey(right.period));
}

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function periodKey(period: string) {
  const parts = periodParts(period);
  return parts ? parts.year * 12 + parts.month : Number.MAX_SAFE_INTEGER;
}

function periodParts(period: string) {
  const match = /^(\d{4})(?:-(\d{1,2}))?/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Math.min(12, Math.max(1, Number(match[2] ?? "1"))) - 1;
  return Number.isFinite(year) ? { month, year } : null;
}

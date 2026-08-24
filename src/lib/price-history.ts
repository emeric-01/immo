import type { CityPriceHistoryPoint } from "./city-market-data";

export type PriceHistoryValuePoint = { label: string; value: number };

export type DisplayCityPriceHistoryPoint = {
  period: string;
  apartment?: number;
  house?: number;
};

export type PriceHistoryChartScale = {
  delta: number;
  points: Array<PriceHistoryValuePoint & { xRatio: number; yRatio: number }>;
  xTicks: Array<{ label: string; xRatio: number }>;
  yMax: number;
  yMin: number;
  yTicks: number[];
};

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

export function prepareCityPriceHistoryForDisplay(
  history: CityPriceHistoryPoint[] | null | undefined,
): DisplayCityPriceHistoryPoint[] {
  const byPeriod = new Map<string, DisplayCityPriceHistoryPoint>();

  for (const point of history ?? []) {
    if (!point?.period) continue;

    const apartment = isPositive(point.apartment) ? point.apartment : undefined;
    const house = isPositive(point.house) ? point.house : undefined;

    if (apartment === undefined && house === undefined) continue;
    byPeriod.set(point.period, { period: point.period, apartment, house });
  }

  return Array.from(byPeriod.values())
    .sort((left, right) => periodKey(left.period) - periodKey(right.period));
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

export function buildPriceHistoryChartScale(points: PriceHistoryValuePoint[]): PriceHistoryChartScale {
  const validPoints = points.filter((point) => point.label && isPositive(point.value));
  if (validPoints.length < 2) return { delta: 0, points: [], xTicks: [], yMax: 0, yMin: 0, yTicks: [] };

  const values = validPoints.map((point) => point.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const step = niceAxisStep(Math.max(1, dataMax - dataMin) / 4);
  let yMin = Math.max(0, Math.floor(dataMin / step) * step);
  let yMax = Math.ceil(dataMax / step) * step;
  if (yMax === yMin) {
    yMin = Math.max(0, yMin - step);
    yMax += step;
  }

  const yTicks: number[] = [];
  for (let value = yMax; value >= yMin && yTicks.length < 7; value -= step) yTicks.push(value);

  const xTickCount = Math.min(5, validPoints.length);
  const xTickIndexes = Array.from({ length: xTickCount }, (_, index) => Math.round(index * (validPoints.length - 1) / (xTickCount - 1)));
  const uniqueTickIndexes = Array.from(new Set(xTickIndexes));
  const denominator = Math.max(1, validPoints.length - 1);
  const yRange = yMax - yMin;

  return {
    delta: (values.at(-1)! - values[0]) / values[0] * 100,
    points: validPoints.map((point, index) => ({ ...point, xRatio: index / denominator, yRatio: (yMax - point.value) / yRange })),
    xTicks: uniqueTickIndexes.map((index) => ({ label: validPoints[index].label, xRatio: index / denominator })),
    yMax,
    yMin,
    yTicks,
  };
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

function niceAxisStep(rawStep: number) {
  const exponent = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * exponent;
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

import type {
  CityPriceHistoryCoverage,
  CityPriceHistoryPoint,
  CityPriceHistoryValueSource,
} from "./city-market-data";

export type PriceHistoryValuePoint = { label: string; value: number };

export type DisplayCityPriceHistoryPoint = {
  period: string;
  apartment?: number;
  house?: number;
  apartmentSource?: CityPriceHistoryValueSource;
  houseSource?: CityPriceHistoryValueSource;
};

type PriceHistoryCoverageOptions = Partial<Pick<
  CityPriceHistoryCoverage,
  "expectedFrom" | "expectedTo" | "granularity"
>>;

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
  coverage?: CityPriceHistoryCoverage,
): DisplayCityPriceHistoryPoint[] {
  const byPeriod = new Map<string, DisplayCityPriceHistoryPoint>();

  for (const point of history ?? []) {
    if (!point?.period) continue;

    const apartment = isPositive(point.apartment) ? point.apartment : undefined;
    const house = isPositive(point.house) ? point.house : undefined;

    byPeriod.set(point.period, {
      period: point.period,
      apartment,
      house,
      apartmentSource: apartment === undefined ? undefined : point.apartmentSource,
      houseSource: house === undefined ? undefined : point.houseSource,
    });
  }

  const effectiveCoverage = coverage ?? buildCityPriceHistoryCoverage(history);
  for (const period of enumeratePeriods(effectiveCoverage)) {
    if (!byPeriod.has(period)) byPeriod.set(period, { period });
  }

  return Array.from(byPeriod.values())
    .sort((left, right) => periodKey(left.period) - periodKey(right.period));
}

export function buildCityPriceHistoryCoverage(
  history: CityPriceHistoryPoint[] | null | undefined,
  options: PriceHistoryCoverageOptions = {},
): CityPriceHistoryCoverage {
  const periods = (history ?? [])
    .map((point) => point?.period)
    .filter((period): period is string => Boolean(period))
    .sort((left, right) => periodKey(left) - periodKey(right));
  const inferredGranularity = inferGranularity(periods);
  const granularity = options.granularity ?? inferredGranularity;
  const expectedFrom = options.expectedFrom ?? periods[0] ?? "";
  const expectedTo = options.expectedTo ?? periods.at(-1) ?? expectedFrom;
  const byPeriod = new Map((history ?? []).map((point) => [point.period, point]));
  const expectedPeriods = enumeratePeriods({
    expectedFrom,
    expectedTo,
    granularity,
    missingApartmentPeriods: [],
    missingHousePeriods: [],
    status: "complete",
  });
  const missingApartmentPeriods = expectedPeriods.filter(
    (period) => !isPositive(byPeriod.get(period)?.apartment ?? 0),
  );
  const missingHousePeriods = expectedPeriods.filter(
    (period) => !isPositive(byPeriod.get(period)?.house ?? 0),
  );

  return {
    expectedFrom,
    expectedTo,
    granularity,
    missingApartmentPeriods,
    missingHousePeriods,
    status: missingApartmentPeriods.length || missingHousePeriods.length ? "partial" : "complete",
  };
}

export function calculateLatestCityPriceHistoryTrend(
  history: CityPriceHistoryPoint[] | null | undefined,
  propertyType: "apartment" | "house",
  granularity: CityPriceHistoryCoverage["granularity"],
): number | null {
  if (granularity === "mixed") return null;

  const byPeriod = new Map(
    (history ?? [])
      .filter((point) => point?.period)
      .map((point) => [periodKey(point.period), point] as const),
  );
  const latestKey = Math.max(...byPeriod.keys());
  if (!Number.isFinite(latestKey)) return null;

  const previousValue = byPeriod.get(latestKey - 12)?.[propertyType];
  const currentValue = byPeriod.get(latestKey)?.[propertyType];
  if (!isPositive(previousValue ?? 0) || !isPositive(currentValue ?? 0)) return null;

  return Number((((currentValue! - previousValue!) / previousValue!) * 100).toFixed(1));
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

function inferGranularity(periods: string[]): CityPriceHistoryCoverage["granularity"] {
  if (periods.length === 0 || periods.every((period) => /^\d{4}$/.test(period))) return "annual";
  if (periods.every((period) => /^\d{4}-\d{2}$/.test(period))) return "monthly";
  return "mixed";
}

function enumeratePeriods(coverage: CityPriceHistoryCoverage) {
  if (!coverage.expectedFrom || !coverage.expectedTo) return [];
  if (coverage.granularity === "mixed") return [];
  const start = periodParts(coverage.expectedFrom);
  const end = periodParts(coverage.expectedTo);
  if (!start || !end) return [];

  if (coverage.granularity === "annual") {
    return Array.from(
      { length: Math.max(0, end.year - start.year + 1) },
      (_, index) => String(start.year + index),
    );
  }

  const startKey = start.year * 12 + start.month;
  const endKey = end.year * 12 + end.month;
  return Array.from({ length: Math.max(0, endKey - startKey + 1) }, (_, index) => {
    const key = startKey + index;
    const year = Math.floor(key / 12);
    const month = key % 12 + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  });
}

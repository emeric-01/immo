export const METHODOLOGY_VERSION = "dvf-iris-v1";

export function quantile(values, ratio) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * ratio;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];
  return Math.round(lower + (upper - lower) * (position - lowerIndex));
}

export function removePriceOutliers(values) {
  const plausible = values.filter((value) => Number.isFinite(value) && value >= 500 && value <= 25_000);
  if (plausible.length < 8) return plausible;

  const q1 = quantile(plausible, 0.25);
  const q3 = quantile(plausible, 0.75);
  const spread = q3 - q1;
  const lowerFence = Math.max(500, q1 - spread * 2);
  const upperFence = Math.min(25_000, q3 + spread * 2);
  return plausible.filter((value) => value >= lowerFence && value <= upperFence);
}

export function reliabilityForCount(observations) {
  if (observations >= 15) return "robust";
  if (observations >= 8) return "indicative";
  if (observations >= 3) return "exploratory";
  return "insufficient";
}

export function confidenceForCount(observations) {
  if (observations >= 100) return 5;
  if (observations >= 15) return 4;
  if (observations >= 8) return 3;
  if (observations >= 3) return 2;
  return 1;
}

export function summarizeSales(sales) {
  const prices = removePriceOutliers(sales.map((sale) => sale.pricePerM2));
  const observations = prices.length;
  const reliability = reliabilityForCount(observations);

  if (observations < 3) {
    return {
      observations,
      medianPricePerM2: null,
      p25PricePerM2: null,
      p75PricePerM2: null,
      reliability,
    };
  }

  return {
    observations,
    medianPricePerM2: quantile(prices, 0.5),
    p25PricePerM2: quantile(prices, 0.25),
    p75PricePerM2: quantile(prices, 0.75),
    reliability,
  };
}

export function calculateTrend(previousValue, currentValue) {
  if (!previousValue || !currentValue) return 0;
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

export function buildAnnualPriceHistory(sales, sourceYears) {
  return sourceYears.flatMap((year) => {
    const yearly = sales.filter((sale) => sale.sourceYear === year);
    const apartmentSummary = summarizeSales(yearly.filter((sale) => sale.propertyType === "apartment"));
    const houseSummary = summarizeSales(yearly.filter((sale) => sale.propertyType === "house"));

    if (apartmentSummary.observations < 3 && houseSummary.observations < 3) return [];

    return [{
      period: String(year),
      apartment: apartmentSummary.medianPricePerM2 ?? 0,
      house: houseSummary.medianPricePerM2 ?? 0,
      apartmentCount: apartmentSummary.observations,
      houseCount: houseSummary.observations,
    }];
  });
}

export function mergeStoredAndDvfHistory(storedHistory, dvfHistory, firstDvfYear) {
  const storedByYear = new Map();
  const dvfByYear = new Map();

  for (const point of storedHistory ?? []) {
    const year = Number.parseInt(String(point?.period ?? "").slice(0, 4), 10);
    if (!Number.isFinite(year)) continue;
    const values = storedByYear.get(year) ?? { apartment: [], house: [] };
    if (point.apartment > 0) {
      values.apartment.push({
        source: point.apartmentSource ?? "immo-data",
        value: point.apartment,
      });
    }
    if (point.house > 0) {
      values.house.push({
        source: point.houseSource ?? "immo-data",
        value: point.house,
      });
    }
    storedByYear.set(year, values);
  }

  for (const point of dvfHistory ?? []) {
    const year = Number.parseInt(String(point?.period ?? "").slice(0, 4), 10);
    if (!Number.isFinite(year) || year < firstDvfYear) continue;
    dvfByYear.set(year, point);
  }

  const years = [...new Set([...storedByYear.keys(), ...dvfByYear.keys()])].sort((left, right) => left - right);
  return years.map((year) => {
    const stored = storedByYear.get(year) ?? { apartment: [], house: [] };
    const dvf = dvfByYear.get(year);
    const apartmentFromDvf = year >= firstDvfYear && dvf?.apartment > 0;
    const houseFromDvf = year >= firstDvfYear && dvf?.house > 0;
    const storedApartment = averageStoredValues(stored.apartment);
    const storedHouse = averageStoredValues(stored.house);

    return {
      period: String(year),
      apartment: apartmentFromDvf ? dvf.apartment : storedApartment.value,
      house: houseFromDvf ? dvf.house : storedHouse.value,
      apartmentSource: apartmentFromDvf ? "dvf" : storedApartment.source,
      houseSource: houseFromDvf ? "dvf" : storedHouse.source,
    };
  });
}

export function inspectHistoryCoverage(history, firstYear, lastYear) {
  const byYear = new Map((history ?? []).map((point) => [Number(point.period), point]));
  const missingApartmentPeriods = [];
  const missingHousePeriods = [];

  for (let year = firstYear; year <= lastYear; year += 1) {
    const point = byYear.get(year);
    if (!(point?.apartment > 0)) missingApartmentPeriods.push(String(year));
    if (!(point?.house > 0)) missingHousePeriods.push(String(year));
  }

  return {
    expectedFrom: String(firstYear),
    expectedTo: String(lastYear),
    granularity: "annual",
    missingApartmentPeriods,
    missingHousePeriods,
    status: missingApartmentPeriods.length || missingHousePeriods.length ? "partial" : "complete",
  };
}

function averageStoredValues(values) {
  if (values.length === 0) return { source: undefined, value: 0 };
  const source = values.every((item) => item.source === values[0].source)
    ? values[0].source
    : "immo-data";
  return {
    source,
    value: Math.round(values.reduce((sum, item) => sum + item.value, 0) / values.length),
  };
}

export function pointInGeometry(point, geometry) {
  if (!geometry || !Array.isArray(point)) return false;
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : [];

  return polygons.some((polygon) => {
    const [outer, ...holes] = polygon;
    return pointInRing(point, outer) && !holes.some((hole) => pointInRing(point, hole));
  });
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current];
    const [previousX, previousY] = ring[previous];
    const crosses = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function largestOuterRing(geometry) {
  const rings = geometry?.type === "Polygon"
    ? [geometry.coordinates?.[0]]
    : geometry?.type === "MultiPolygon"
      ? geometry.coordinates?.map((polygon) => polygon[0])
      : [];
  return (rings ?? [])
    .filter(Boolean)
    .sort((left, right) => Math.abs(ringArea(right)) - Math.abs(ringArea(left)))[0] ?? [];
}

export function polygonLabelPoint(geometry) {
  const ring = largestOuterRing(geometry);
  if (ring.length === 0) return [0, 0];

  let area = 0;
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    longitude += (x1 + x2) * cross;
    latitude += (y1 + y2) * cross;
  }

  if (Math.abs(area) < Number.EPSILON) return ring[0];
  const candidate = [longitude / (3 * area), latitude / (3 * area)];
  return pointInGeometry(candidate, geometry) ? candidate : ring[0];
}

function ringArea(ring) {
  if (!ring) return 0;
  return ring.reduce((total, [x1, y1], index) => {
    const [x2, y2] = ring[(index + 1) % ring.length];
    return total + x1 * y2 - x2 * y1;
  }, 0) / 2;
}

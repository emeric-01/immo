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

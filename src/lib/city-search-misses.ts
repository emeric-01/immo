export type CitySearchMissEvent = {
  created_at: string;
  id: number;
  query_display: string;
  query_normalized: string;
  source: string;
};

export type CitySearchMissSummary = {
  displayQuery: string;
  firstSearchedAt: string;
  lastSearchedAt: string;
  normalizedQuery: string;
  searchCount: number;
};

export type ValidatedCitySearchMiss = {
  display: string;
  normalized: string;
};

const maxQueryLength = 80;
const minQueryLength = 2;

export function normalizeCitySearchMissQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''’`-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function validateCitySearchMiss(value: unknown): ValidatedCitySearchMiss | null {
  if (typeof value !== "string") return null;

  const display = value.replace(/\s+/g, " ").trim();

  if (display.length < minQueryLength || display.length > maxQueryLength) return null;
  if (/[\u0000-\u001f\u007f]/.test(display)) return null;
  if (/https?:\/\//i.test(display) || /www\./i.test(display) || /@/.test(display)) return null;

  const normalized = normalizeCitySearchMissQuery(display);
  if (normalized.length < minQueryLength || normalized.length > maxQueryLength) return null;

  return { display, normalized };
}

export function aggregateCitySearchMisses(rows: CitySearchMissEvent[]) {
  const summaries = new Map<string, CitySearchMissSummary>();

  for (const row of rows) {
    const current = summaries.get(row.query_normalized);

    if (!current) {
      summaries.set(row.query_normalized, {
        displayQuery: row.query_display,
        firstSearchedAt: row.created_at,
        lastSearchedAt: row.created_at,
        normalizedQuery: row.query_normalized,
        searchCount: 1,
      });
      continue;
    }

    current.searchCount += 1;

    if (new Date(row.created_at) > new Date(current.lastSearchedAt)) {
      current.displayQuery = row.query_display;
      current.lastSearchedAt = row.created_at;
    }

    if (new Date(row.created_at) < new Date(current.firstSearchedAt)) {
      current.firstSearchedAt = row.created_at;
    }
  }

  return Array.from(summaries.values()).sort((left, right) => {
    if (right.searchCount !== left.searchCount) return right.searchCount - left.searchCount;
    return new Date(right.lastSearchedAt).getTime() - new Date(left.lastSearchedAt).getTime();
  });
}

import type { DirectoryCity } from "./city-directory";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getCitySearchOptionLabel(city: DirectoryCity) {
  return `${city.name} — ${city.postalCode}`;
}

export function findCitySearchMatch(cities: DirectoryCity[], query: string) {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) return null;

  return (
    cities.find(
      (city) => normalizeSearch(getCitySearchOptionLabel(city)) === normalizedQuery,
    ) ??
    cities.find((city) => normalizeSearch(city.name) === normalizedQuery) ??
    cities.find((city) => city.postalCode === normalizedQuery) ??
    cities.find((city) => normalizeSearch(city.name).startsWith(normalizedQuery)) ??
    null
  );
}

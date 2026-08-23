import type { AddressSuggestion } from "@/lib/immo-data";

const MAX_ADDRESS_SUGGESTIONS = 8;

function suggestionKey(suggestion: AddressSuggestion) {
  return suggestion.addressId
    ?? `${suggestion.label}|${suggestion.longitude}|${suggestion.latitude}`;
}

export function prioritizeAddressSuggestions(
  citySuggestions: AddressSuggestion[],
  broadSuggestions: AddressSuggestion[],
  preferredInseeCode: string,
  preferPreferredCity = true,
) {
  const uniqueSuggestions = new Map<string, AddressSuggestion>();
  const orderedSuggestions = preferPreferredCity
    ? [...citySuggestions, ...broadSuggestions]
    : [...broadSuggestions, ...citySuggestions];

  for (const suggestion of orderedSuggestions) {
    uniqueSuggestions.set(suggestionKey(suggestion), suggestion);
  }

  const suggestions = [...uniqueSuggestions.values()];

  if (preferPreferredCity) {
    suggestions.sort((left, right) =>
      Number(right.inseeCode === preferredInseeCode)
      - Number(left.inseeCode === preferredInseeCode),
    );
  }

  return suggestions.slice(0, MAX_ADDRESS_SUGGESTIONS);
}

function normalizeLocation(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

export function getExplicitExternalLocationSuggestions(
  query: string,
  broadSuggestions: AddressSuggestion[],
  preferredInseeCode: string,
) {
  const normalizedQuery = normalizeLocation(query);
  const queryPostalCodes = new Set(query.match(/\b\d{5}\b/g) ?? []);

  return broadSuggestions.filter((suggestion) => {
    if (!suggestion.inseeCode || suggestion.inseeCode === preferredInseeCode) return false;

    const matchesPostalCode = suggestion.postCode?.some((postCode) => queryPostalCodes.has(postCode)) ?? false;
    const normalizedCityName = suggestion.cityName ? normalizeLocation(suggestion.cityName) : "";
    const matchesCityName = normalizedCityName.length > 1 && normalizedQuery.includes(normalizedCityName);

    return matchesPostalCode || matchesCityName;
  });
}

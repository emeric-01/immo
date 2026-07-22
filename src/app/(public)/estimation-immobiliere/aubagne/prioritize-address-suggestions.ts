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
) {
  const uniqueSuggestions = new Map<string, AddressSuggestion>();

  for (const suggestion of [...citySuggestions, ...broadSuggestions]) {
    uniqueSuggestions.set(suggestionKey(suggestion), suggestion);
  }

  return [...uniqueSuggestions.values()]
    .sort((left, right) =>
      Number(right.inseeCode === preferredInseeCode)
      - Number(left.inseeCode === preferredInseeCode),
    )
    .slice(0, MAX_ADDRESS_SUGGESTIONS);
}

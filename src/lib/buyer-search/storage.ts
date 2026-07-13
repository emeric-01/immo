import type { BuyerSearchFormData } from "./types";

export const buyerSearchDraftKey = "les-jumelles:buyer-search:draft";
export const buyerSearchSubmittedKey = "les-jumelles:buyer-search:submitted";

export function loadBuyerSearchDraft(): BuyerSearchFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buyerSearchDraftKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BuyerSearchFormData;
  } catch {
    return null;
  }
}

export function saveBuyerSearchDraft(data: BuyerSearchFormData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buyerSearchDraftKey, JSON.stringify(data));
}

export function saveSubmittedBuyerSearch(data: BuyerSearchFormData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buyerSearchSubmittedKey, JSON.stringify(data));
}

export function loadSubmittedBuyerSearch(): BuyerSearchFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buyerSearchSubmittedKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BuyerSearchFormData;
  } catch {
    return null;
  }
}

import { defaultBuyerSearchData, type BuyerSearchFormData } from "./types";
import type { BuyerSearchSubmissionResult } from "./database";

export const buyerSearchDraftKey = "les-jumelles:buyer-search:draft";
export const buyerSearchSubmittedKey = "les-jumelles:buyer-search:submitted";

export type BuyerSearchSubmittedSnapshot = {
  data: BuyerSearchFormData;
  result?: BuyerSearchSubmissionResult;
  submittedAt: string;
};

export function loadBuyerSearchDraft(): BuyerSearchFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buyerSearchDraftKey);

  if (!raw) {
    return null;
  }

  try {
    return withoutContactDetails(JSON.parse(raw) as BuyerSearchFormData);
  } catch {
    return null;
  }
}

export function saveBuyerSearchDraft(data: BuyerSearchFormData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buyerSearchDraftKey, JSON.stringify(withoutContactDetails(data)));
}

function withoutContactDetails(data: BuyerSearchFormData): BuyerSearchFormData {
  return {
    ...data,
    contact: { ...defaultBuyerSearchData.contact },
  };
}

export function saveSubmittedBuyerSearch(data: BuyerSearchFormData, result?: BuyerSearchSubmissionResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    buyerSearchSubmittedKey,
    JSON.stringify({
      data,
      result,
      submittedAt: new Date().toISOString(),
    } satisfies BuyerSearchSubmittedSnapshot),
  );
}

export function loadSubmittedBuyerSearchSnapshot(): BuyerSearchSubmittedSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buyerSearchSubmittedKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as BuyerSearchSubmittedSnapshot | BuyerSearchFormData;

    if ("data" in parsed && parsed.data) {
      return parsed as BuyerSearchSubmittedSnapshot;
    }

    return {
      data: parsed as BuyerSearchFormData,
      submittedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function loadSubmittedBuyerSearch(): BuyerSearchFormData | null {
  return loadSubmittedBuyerSearchSnapshot()?.data ?? null;
}

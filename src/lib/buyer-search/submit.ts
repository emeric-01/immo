import { saveSubmittedBuyerSearch } from "./storage";
import type { BuyerSearchFormData } from "./types";
import type { BuyerSearchSubmissionResult } from "./database";

export async function submitBuyerSearch(data: BuyerSearchFormData): Promise<BuyerSearchSubmissionResult> {
  const searchId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("searchId");
  const endpoint = searchId
    ? `/api/buyer-searches?searchId=${encodeURIComponent(searchId)}`
    : "/api/buyer-searches";
  const response = await fetch(endpoint, {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const result = (await response.json()) as BuyerSearchSubmissionResult | { error?: string };

  if (!response.ok) {
    throw new Error("error" in result && result.error ? result.error : "La recherche n'a pas pu etre enregistree.");
  }

  saveSubmittedBuyerSearch(data, result as BuyerSearchSubmissionResult);

  return result as BuyerSearchSubmissionResult;
}

import { saveSubmittedBuyerSearch } from "./storage";
import type { BuyerSearchFormData } from "./types";
import type { BuyerSearchSubmissionResult } from "./database";

export async function submitBuyerSearch(data: BuyerSearchFormData): Promise<BuyerSearchSubmissionResult> {
  saveSubmittedBuyerSearch(data);

  const response = await fetch("/api/buyer-searches", {
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

  return result as BuyerSearchSubmissionResult;
}

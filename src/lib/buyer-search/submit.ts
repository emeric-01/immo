import { saveSubmittedBuyerSearch } from "./storage";
import type { BuyerSearchFormData } from "./types";

export async function submitBuyerSearch(data: BuyerSearchFormData) {
  saveSubmittedBuyerSearch(data);

  if (process.env.NODE_ENV === "development") {
    console.info("Buyer search submitted", data);
  }

  return {
    id: `local-${Date.now()}`,
  };
}

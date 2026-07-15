import { beforeEach, describe, expect, it } from "vitest";
import { defaultBuyerSearchData } from "./types";
import {
  buyerSearchDraftKey,
  loadBuyerSearchDraft,
  loadSubmittedBuyerSearch,
  saveBuyerSearchDraft,
  saveSubmittedBuyerSearch,
} from "./storage";

const contact = {
  consent: true,
  email: "claire@example.com",
  firstName: "Claire",
  lastName: "Dupont",
  phone: "06 12 34 56 78",
  preferredChannel: "phone" as const,
};

describe("buyer search browser storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not persist contact details in the automatic draft", () => {
    saveBuyerSearchDraft({ ...defaultBuyerSearchData, contact });

    const stored = JSON.parse(window.localStorage.getItem(buyerSearchDraftKey) ?? "null");

    expect(stored.contact).toEqual(defaultBuyerSearchData.contact);
    expect(loadBuyerSearchDraft()?.contact).toEqual(defaultBuyerSearchData.contact);
  });

  it("removes contact details from a legacy draft when loading it", () => {
    window.localStorage.setItem(
      buyerSearchDraftKey,
      JSON.stringify({ ...defaultBuyerSearchData, contact }),
    );

    expect(loadBuyerSearchDraft()?.contact).toEqual(defaultBuyerSearchData.contact);
  });

  it("keeps the submitted contact snapshot after explicit submission", () => {
    saveSubmittedBuyerSearch({ ...defaultBuyerSearchData, contact });

    expect(loadSubmittedBuyerSearch()?.contact).toEqual(contact);
  });
});

import { describe, expect, it } from "vitest";
import { buildAgentShareLink } from "./agent-share-link";

const attribution = {
  campaign: "agent",
  code: "sebastien-ledoyen",
  medium: "referral",
  source: "sebastien-ledoyen",
};

describe("buildAgentShareLink", () => {
  it("ajoute uniquement la référence agent visible à l’URL du site", () => {
    const result = buildAgentShareLink(
      "https://jumellesimmo.fr/prix-immobilier/aubagne?bien=maison#estimation",
      "https://jumellesimmo.fr",
      attribution,
    );

    expect(result).toEqual({
      success: true,
      url: "https://jumellesimmo.fr/prix-immobilier/aubagne?bien=maison&ref=sebastien-ledoyen#estimation",
    });
  });

  it("accepte un chemin relatif et retire les anciens paramètres de suivi", () => {
    const result = buildAgentShareLink(
      "/estimation?utm_source=ancien&ref=ancien",
      "https://jumellesimmo.fr",
      attribution,
    );

    expect(result).toEqual({
      success: true,
      url: "https://jumellesimmo.fr/estimation?ref=sebastien-ledoyen",
    });
  });

  it("accepte la variante www du domaine", () => {
    const result = buildAgentShareLink(
      "https://www.jumellesimmo.fr/recherche",
      "https://jumellesimmo.fr",
      attribution,
    );

    expect(result.success).toBe(true);
  });

  it.each([
    ["", "Collez d’abord l’URL d’une page du site."],
    ["pas une url", "Cette URL n’est pas valide."],
    ["https://example.com/estimation", "Utilisez uniquement une URL du site Les Jumelles Immo."],
    ["javascript:alert(1)", "Utilisez uniquement une URL du site Les Jumelles Immo."],
    ["https://jumellesimmo.fr/admin", "Choisissez une page publique du site."],
    ["https://jumellesimmo.fr/l/sebastien", "Choisissez une page publique du site."],
  ])("refuse une destination non partageable", (input, error) => {
    expect(buildAgentShareLink(input, "https://jumellesimmo.fr", attribution)).toEqual({ error, success: false });
  });
});

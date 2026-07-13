import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuyerSearchDesignSystemDemo } from "./design-system-demo";

describe("BuyerSearchDesignSystemDemo", () => {
  it("renders the phase 1 buyer-search design system components", () => {
    render(createElement(BuyerSearchDesignSystemDemo));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Module de recherche acheteurs",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Progression du formulaire" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuer/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Ville ou secteur recherche")).toHaveValue(
      "Gemenos",
    );
    expect(screen.getByRole("button", { name: /Maison/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Votre brouillon est sauvegarde localement",
    );
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./MarkdownContent";

describe("MarkdownContent", () => {
  it("renders editorial tables and a discreet internal CTA", () => {
    render(<MarkdownContent markdown={`
Un **avis de valeur** tient compte du marché local.

| Repère | Utilité |
| --- | --- |
| DVF | Vérifier les ventes signées |
| Visite | Observer les qualités du bien |

:::cta [Estimer mon bien](/estimation) Situez votre projet avec une analyse locale.
`} />);

    expect(screen.getByText("avis de valeur").tagName).toBe("STRONG");
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Repère" })).toBeInTheDocument();
    expect(within(table).getByText("Vérifier les ventes signées")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Estimer mon bien/i })).toHaveAttribute("href", "/estimation");
    expect(screen.getByText("Situez votre projet avec une analyse locale.")).toBeInTheDocument();
  });
});

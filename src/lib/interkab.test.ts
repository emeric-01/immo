import { describe, expect, it } from "vitest";
import { parseInterkabDetailPage, parseInterkabSearchPage } from "./interkab";

describe("Interkab pilot parser", () => {
  it("reads a property card and the Aubagne result count", () => {
    const parsed = parseInterkabSearchPage(`
      <h2 class="level-6 section__results">110 annonces immobilières</h2>
      <a href="https://interkab.com/immobilier-13400-aubagne/annonces/13729972-propriete-a-vendre" class="card card-property js-card-property">
        <img src="https://images.test/cover.jpg" alt="property">
        <div class="card__price"><div class="level-5">670 000 €</div></div>
        <div class="card__type"><div class="level-6">Propriete</div></div>
        <div class="card__info"><ul><li>7 pièces</li><li>5 chambres</li><li>178 m²</li></ul>
          <div class="card__location"><div class="card__location-content"><p>Aubagne</p></div><span>Arnaud Solans</span></div>
        </div>
      </a><!-- /.card-property -->
      <a class="btn load_more" data-current="1" data-max="11"></a>
    `);
    expect(parsed.resultCount).toBe(110);
    expect(parsed.pageCount).toBe(11);
    expect(parsed.listings[0]).toMatchObject({ externalId: "13729972", price: 670000, rooms: 7, bedrooms: 5, surfaceM2: 178 });
  });

  it("reads agency data from structured listing data", () => {
    const detail = parseInterkabDetailPage(`<script type="application/ld+json">{
      "@graph":[{"@type":"SingleFamilyResidence","offers":{"validFrom":"2026-08-10 21:15:20"},
      "realEstateAgent":{"name":"Andros immobilier","telephone":"0651618041","url":"https://andros-immobilier.com"}}]
    }</script>`);
    expect(detail).toEqual({
      agencyName: "Andros immobilier",
      agencyPhone: "0651618041",
      agencySiteUrl: "https://andros-immobilier.com",
      publishedAt: "2026-08-10 21:15:20",
    });
  });
});

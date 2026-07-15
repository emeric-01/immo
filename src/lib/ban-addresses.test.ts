import { describe, expect, it } from "vitest";
import { mapBanResponse } from "./ban-addresses";

describe("mapBanResponse", () => {
  it("maps an exact BAN address to the estimation address format", () => {
    expect(
      mapBanResponse({
        features: [
          {
            geometry: { coordinates: [2.062821, 49.031624], type: "Point" },
            properties: {
              banId: "8e6b04d7-f6fd-48a1-80be-4ec984a286e8",
              city: "Cergy",
              citycode: "95127",
              depcode: "95",
              label: "8 Boulevard du Port 95000 Cergy",
              postcode: "95000",
              score: 0.97,
              type: "housenumber",
            },
            type: "Feature",
          },
        ],
        type: "FeatureCollection",
      }),
    ).toEqual([
      {
        addressId: "8e6b04d7-f6fd-48a1-80be-4ec984a286e8",
        cityName: "Cergy",
        departmentCode: "95",
        inseeCode: "95127",
        label: "8 Boulevard du Port 95000 Cergy",
        latitude: 49.031624,
        longitude: 2.062821,
        postCode: ["95000"],
      },
    ]);
  });

  it("drops low-confidence or non-address results", () => {
    expect(
      mapBanResponse({
        features: [
          {
            geometry: { coordinates: [2, 48] },
            properties: { label: "Résultat incertain", score: 0.1, type: "street" },
          },
          {
            geometry: { coordinates: [2, 48] },
            properties: { label: "Une commune", score: 0.9, type: "municipality" },
          },
        ],
      }),
    ).toEqual([]);
  });
});

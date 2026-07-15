"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CityPriceZone, CitySalePoint } from "@/lib/city-market-data";

type CityPriceMapProps = {
  accessToken: string;
  cityName: string;
  center: {
    longitude: number;
    latitude: number;
  };
  zones: CityPriceZone[];
  salePoints: CitySalePoint[];
};

type MapStatus = "idle" | "ready" | "missing-token" | "error";
type SaleFilter = "all" | CitySalePoint["propertyType"];

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatPrice(value: number) {
  return `${priceFormatter.format(value)} EUR/m2`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFeatureProperties(feature: unknown): Record<string, unknown> | null {
  if (!feature || typeof feature !== "object" || !("properties" in feature)) {
    return null;
  }

  const properties = (feature as { properties?: unknown }).properties;

  return properties && typeof properties === "object"
    ? (properties as Record<string, unknown>)
    : null;
}

function getPointCoordinates(feature: unknown): [number, number] | null {
  if (!feature || typeof feature !== "object" || !("geometry" in feature)) {
    return null;
  }

  const geometry = (feature as {
    geometry?: { type?: string; coordinates?: unknown };
  }).geometry;
  const coordinates = geometry?.coordinates;

  if (
    geometry?.type === "Point" &&
    Array.isArray(coordinates) &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return [coordinates[0], coordinates[1]];
  }

  return null;
}

function buildZoneCollection(zones: CityPriceZone[]) {
  return {
    type: "FeatureCollection" as const,
    features: zones.map((zone) => ({
      type: "Feature" as const,
      properties: {
        id: zone.id,
        name: zone.name,
        pricePerM2: zone.pricePerM2,
        color: zone.color,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[...zone.polygon, zone.polygon[0]]],
      },
    })),
  };
}

function buildSalesCollection(salePoints: CitySalePoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: salePoints.map((salePoint) => ({
      type: "Feature" as const,
      properties: {
        id: salePoint.id,
        label: salePoint.label,
        propertyType: salePoint.propertyType,
        rooms: salePoint.rooms,
        surfaceM2: salePoint.surfaceM2,
        soldAt: salePoint.soldAt,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [salePoint.longitude, salePoint.latitude],
      },
    })),
  };
}

export function CityPriceMap({
  accessToken,
  cityName,
  center,
  zones,
  salePoints,
}: CityPriceMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [saleFilter, setSaleFilter] = useState<SaleFilter>("all");
  const [showSales, setShowSales] = useState(true);
  const [activeZoneId, setActiveZoneId] = useState(zones[0]?.id ?? "");
  const activeZoneIdRef = useRef(activeZoneId);

  const activeZone = useMemo(() => {
    return zones.find((zone) => zone.id === activeZoneId) ?? zones[0];
  }, [activeZoneId, zones]);

  const filteredSalePoints = useMemo(() => {
    if (!showSales) {
      return [];
    }

    return saleFilter === "all"
      ? salePoints
      : salePoints.filter((salePoint) => salePoint.propertyType === saleFilter);
  }, [saleFilter, salePoints, showSales]);

  useEffect(() => {
    activeZoneIdRef.current = activeZoneId;
  }, [activeZoneId]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!accessToken) {
      setStatus("missing-token");
      return;
    }

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.longitude, center.latitude],
      zoom: 12.4,
      pitch: 0,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      const zoneCollection = buildZoneCollection(zones);
      const salesCollection = buildSalesCollection(salePoints);

      map.addSource("price-zones", {
        type: "geojson",
        data: zoneCollection,
      });

      map.addLayer({
        id: "price-zones-fill",
        type: "fill",
        source: "price-zones",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], activeZoneIdRef.current],
            0.82,
            0.58,
          ],
        },
      });

      map.addLayer({
        id: "price-zones-line",
        type: "line",
        source: "price-zones",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "id"], activeZoneIdRef.current],
            "#171612",
            "#ffffff",
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], activeZoneIdRef.current],
            3,
            1.5,
          ],
          "line-opacity": 0.95,
        },
      });

      map.addSource("sold-properties", {
        type: "geojson",
        data: salesCollection,
      });

      map.addLayer({
        id: "sold-properties",
        type: "circle",
        source: "sold-properties",
        paint: {
          "circle-color": [
            "match",
            ["get", "propertyType"],
            "Maison",
            "#72775a",
            "#b77b4c",
          ],
          "circle-radius": 7.5,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.on("click", "price-zones-fill", (event) => {
        const properties = getFeatureProperties(event.features?.[0]);
        const zoneId = properties?.id;

        if (typeof zoneId === "string") {
          setActiveZoneId(zoneId);
        }
      });

      map.on("mouseenter", "price-zones-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "price-zones-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "sold-properties", (event) => {
        const feature = event.features?.[0];
        const properties = getFeatureProperties(feature);
        const coordinates = getPointCoordinates(feature);

        if (!properties || !coordinates) {
          return;
        }

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: "260px" })
          .setLngLat(coordinates)
          .setHTML(`
            <strong>${escapeHtml(String(properties.label ?? "Vente realisee"))}</strong>
            <span>${escapeHtml(String(properties.propertyType ?? "Bien"))} ${escapeHtml(String(properties.rooms ?? ""))} pieces</span>
            <span>${escapeHtml(String(properties.surfaceM2 ?? ""))} m2 - ${escapeHtml(String(properties.soldAt ?? "Date NC"))}</span>
          `)
          .addTo(map);
      });

      map.on("mouseenter", "sold-properties", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "sold-properties", () => {
        map.getCanvas().style.cursor = "";
      });

      setStatus("ready");
    });

    map.on("error", () => {
      setStatus("error");
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      popupRef.current = null;
      mapRef.current = null;
    };
  }, [accessToken, center.latitude, center.longitude, salePoints, zones]);

  useEffect(() => {
    const map = mapRef.current;

    if (status !== "ready" || !map?.getLayer("sold-properties")) {
      return;
    }

    map.setLayoutProperty(
      "sold-properties",
      "visibility",
      showSales ? "visible" : "none",
    );

    map.setFilter(
      "sold-properties",
      saleFilter === "all" ? null : ["==", ["get", "propertyType"], saleFilter],
    );
  }, [saleFilter, showSales, status]);

  useEffect(() => {
    const map = mapRef.current;

    if (
      status !== "ready" ||
      !map?.getLayer("price-zones-fill") ||
      !map.getLayer("price-zones-line")
    ) {
      return;
    }

    map.setPaintProperty("price-zones-fill", "fill-opacity", [
      "case",
      ["==", ["get", "id"], activeZoneId],
      0.82,
      0.58,
    ]);
    map.setPaintProperty("price-zones-line", "line-color", [
      "case",
      ["==", ["get", "id"], activeZoneId],
      "#171612",
      "#ffffff",
    ]);
    map.setPaintProperty("price-zones-line", "line-width", [
      "case",
      ["==", ["get", "id"], activeZoneId],
      3,
      1.5,
    ]);
  }, [activeZoneId, status]);

  const showFallback = status === "missing-token" || status === "error";

  return (
    <div className="city-map-shell">
      <div className="city-map-toolbar">
        <div className="city-map-tabs" aria-label="Ventes affichees">
          {[
            ["all", "Tous"],
            ["Appartement", "Appartements"],
            ["Maison", "Maisons"],
          ].map(([value, label]) => (
            <button
              className={saleFilter === value ? "active" : ""}
              key={value}
              onClick={() => setSaleFilter(value as SaleFilter)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="city-map-scale" aria-label="Legende des prix">
          <span>&lt; 3000 EUR</span>
          <span className="scale-track" aria-hidden="true" />
          <span>&gt; 4000 EUR</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={showFallback ? "city-map fallback" : "city-map"}
        aria-label={`Carte des prix immobiliers a ${cityName}`}
      >
        {showFallback ? (
          <div className="mock-map" aria-hidden="true">
            {zones.map((zone, index) => (
              <span
                className={zone.id === activeZone?.id ? "mock-zone active" : "mock-zone"}
                key={zone.id}
                style={{
                  background: zone.color,
                  left: `${10 + (index % 3) * 27}%`,
                  top: `${12 + Math.floor(index / 3) * 28}%`,
                }}
              />
            ))}
            {filteredSalePoints.map((salePoint, index) => (
              <span
                className={`mock-sale-point ${salePoint.propertyType === "Maison" ? "house" : ""}`}
                key={salePoint.id}
                style={{
                  left: `${18 + (index * 13) % 66}%`,
                  top: `${24 + (index * 17) % 48}%`,
                }}
              />
            ))}
            <strong>{cityName}</strong>
          </div>
        ) : null}
      </div>

      {activeZone ? (
        <aside className="city-map-inspector" aria-live="polite">
          <span>Secteur selectionne</span>
          <strong>{activeZone.name}</strong>
          <p>{formatPrice(activeZone.pricePerM2)}</p>
          <div className="city-map-zone-list">
            {zones.slice(0, 4).map((zone) => (
              <button
                className={zone.id === activeZone.id ? "active" : ""}
                key={zone.id}
                onClick={() => setActiveZoneId(zone.id)}
                type="button"
              >
                <span style={{ background: zone.color }} />
                {zone.name}
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="city-map-footer">
        <label>
          <input
            checked={showSales}
            onChange={(event) => setShowSales(event.target.checked)}
            type="checkbox"
          />
          Biens vendus
        </label>
        <span>{filteredSalePoints.length} dernières transactions affichées</span>
      </div>
    </div>
  );
}

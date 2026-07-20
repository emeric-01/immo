"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CitySalePoint } from "@/lib/city-market-data";
import styles from "./local-agency.module.css";

type LocalAgencySalesMapProps = {
  accessToken: string;
  center: {
    latitude: number;
    longitude: number;
  };
  cityName: string;
  salePoints: CitySalePoint[];
};

type MapStatus = "loading" | "ready" | "unavailable";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function buildSalesCollection(salePoints: CitySalePoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: salePoints.map((salePoint) => ({
      type: "Feature" as const,
      properties: {
        label: salePoint.label,
        price: salePoint.price ?? null,
        pricePerM2: salePoint.pricePerM2 ?? null,
        propertyType: salePoint.propertyType,
        rooms: salePoint.rooms,
        soldAt: salePoint.soldAt,
        surfaceM2: salePoint.surfaceM2,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [salePoint.longitude, salePoint.latitude],
      },
    })),
  };
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
    geometry?: { coordinates?: unknown; type?: string };
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

function appendPopupLine(container: HTMLElement, value: string, strong = false) {
  const line = document.createElement(strong ? "strong" : "span");
  line.textContent = value;
  container.appendChild(line);
}

function createSalePopup(properties: Record<string, unknown>) {
  const content = document.createElement("div");
  content.className = styles.salePopup;

  appendPopupLine(content, String(properties.label || "Vente enregistrée"), true);

  const propertyType = String(properties.propertyType || "Bien");
  const rooms = Number(properties.rooms || 0);
  const surfaceM2 = Number(properties.surfaceM2 || 0);
  appendPopupLine(
    content,
    [propertyType, rooms > 0 ? `${rooms} pièce${rooms > 1 ? "s" : ""}` : ""]
      .filter(Boolean)
      .join(" · "),
  );
  appendPopupLine(
    content,
    [surfaceM2 > 0 ? `${surfaceM2} m²` : "", String(properties.soldAt || "Date non précisée")]
      .filter(Boolean)
      .join(" · "),
  );

  const price = Number(properties.price || 0);
  const pricePerM2 = Number(properties.pricePerM2 || 0);
  if (price > 0 || pricePerM2 > 0) {
    appendPopupLine(
      content,
      [
        price > 0 ? `${priceFormatter.format(price)} €` : "",
        pricePerM2 > 0 ? `${priceFormatter.format(pricePerM2)} €/m²` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      true,
    );
  }

  return content;
}

export function LocalAgencySalesMap({
  accessToken,
  center,
  cityName,
  salePoints,
}: LocalAgencySalesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const latestSales = useMemo(() => salePoints.slice(0, 30), [salePoints]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!accessToken) {
      setStatus("unavailable");
      return;
    }

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      attributionControl: true,
      center: [center.longitude, center.latitude],
      container: containerRef.current,
      maxZoom: 17,
      minZoom: 9,
      pitch: 0,
      style: "mapbox://styles/mapbox/light-v11",
      zoom: 11.15,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("local-agency-dvf-sales", {
        data: buildSalesCollection(latestSales),
        type: "geojson",
      });

      map.addLayer({
        id: "local-agency-dvf-sales-halo",
        paint: {
          "circle-color": "rgba(190, 112, 65, .18)",
          "circle-radius": 10,
        },
        source: "local-agency-dvf-sales",
        type: "circle",
      });

      map.addLayer({
        id: "local-agency-dvf-sales",
        paint: {
          "circle-color": [
            "match",
            ["get", "propertyType"],
            "Maison",
            "#74795d",
            "#bd7145",
          ],
          "circle-radius": 5.5,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.8,
        },
        source: "local-agency-dvf-sales",
        type: "circle",
      });

      map.on("click", "local-agency-dvf-sales", (event) => {
        const feature = event.features?.[0];
        const coordinates = getPointCoordinates(feature);
        const properties = getFeatureProperties(feature);

        if (!coordinates || !properties) return;

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: "270px" })
          .setLngLat(coordinates)
          .setDOMContent(createSalePopup(properties))
          .addTo(map);
      });

      map.on("mouseenter", "local-agency-dvf-sales", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "local-agency-dvf-sales", () => {
        map.getCanvas().style.cursor = "";
      });

      setStatus("ready");
    });

    map.on("error", () => setStatus("unavailable"));

    return () => {
      popupRef.current?.remove();
      map.remove();
      popupRef.current = null;
    };
  }, [accessToken, center.latitude, center.longitude, latestSales]);

  const saleCountLabel =
    latestSales.length === 30
      ? "30 dernières ventes DVF"
      : `${latestSales.length} vente${latestSales.length > 1 ? "s" : ""} DVF disponible${latestSales.length > 1 ? "s" : ""}`;

  return (
    <div className={styles.localMap}>
      <div
        aria-label={`Carte des dernières ventes immobilières à ${cityName}`}
        className={styles.localMapCanvas}
        ref={containerRef}
      />
      {status === "loading" ? (
        <div className={styles.mapStatus}>Chargement de la carte…</div>
      ) : null}
      {status === "unavailable" ? (
        <div className={styles.mapFallback}>
          <MapFallback cityName={cityName} />
        </div>
      ) : null}
      <div className={styles.mapLegend} aria-label="Légende de la carte">
        <span className={styles.apartmentDot} />
        <span>Appartement</span>
        <span className={styles.houseDot} />
        <span>Maison</span>
        <strong>{saleCountLabel}</strong>
      </div>
      <span className={styles.mapCityLabel}>{cityName}</span>
    </div>
  );
}

function MapFallback({ cityName }: { cityName: string }) {
  return (
    <div>
      <span aria-hidden="true" />
      <p>Carte de {cityName}</p>
    </div>
  );
}

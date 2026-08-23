"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronDown, Database, Home, MapPinned } from "lucide-react";
import {
  aubagneDvfAudit,
  aubagneDvfPreviewZones,
  type AubagneDvfPreviewZone,
  type DvfIrisPriceStat,
} from "@/lib/aubagne-dvf-preview-data";
import styles from "./aubagne-dvf-preview-map.module.css";

type PropertyType = "apartment" | "house";
type MapStatus = "idle" | "ready" | "missing-token" | "error";

type AubagneDvfPreviewMapProps = {
  accessToken: string;
  communalApartmentPrice: number;
  communalHousePrice: number;
};

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const countFormatter = new Intl.NumberFormat("fr-FR");
const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 610;
const MAP_PADDING = 32;
const LONGITUDE_CORRECTION = Math.cos((43.3 * Math.PI) / 180);
const FEATURED_LABELS = new Set([
  "Arnaud Solans",
  "Beaudinard",
  "Camp Major",
  "Centre Ville",
  "Garlaban-Royante",
  "Longuillar",
  "Passons",
  "Pérussone",
]);
const MAP_SOURCE_ID = "aubagne-dvf-iris";
const MAP_FILL_LAYER_ID = "aubagne-dvf-iris-fill";
const MAP_LINE_LAYER_ID = "aubagne-dvf-iris-line";
const MAP_LABEL_LAYER_ID = "aubagne-dvf-iris-label";

function getGeometry() {
  const points = aubagneDvfPreviewZones.flatMap((zone) => zone.polygon);
  const longitudes = points.map(([longitude]) => longitude * LONGITUDE_CORRECTION);
  const latitudes = points.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const width = maxLongitude - minLongitude;
  const height = maxLatitude - minLatitude;
  const scale = Math.min(
    (VIEWBOX_WIDTH - MAP_PADDING * 2) / width,
    (VIEWBOX_HEIGHT - MAP_PADDING * 2) / height,
  );
  const projectedWidth = width * scale;
  const projectedHeight = height * scale;
  const offsetX = (VIEWBOX_WIDTH - projectedWidth) / 2;
  const offsetY = (VIEWBOX_HEIGHT - projectedHeight) / 2;

  const project = ([longitude, latitude]: [number, number]) => [
    offsetX + (longitude * LONGITUDE_CORRECTION - minLongitude) * scale,
    offsetY + (maxLatitude - latitude) * scale,
  ] as const;

  return { project };
}

const geometry = getGeometry();

function getPath(zone: AubagneDvfPreviewZone) {
  return `${zone.polygon.map((point, index) => {
    const [x, y] = geometry.project(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ")} Z`;
}

function getConfidenceScore(stat: DvfIrisPriceStat) {
  if (stat.medianPricePerM2 === null || stat.observations < 3) return 1;
  if (stat.observations >= 50) return 5;
  if (stat.observations >= 20) return 4;
  if (stat.observations >= 8) return 3;
  return 2;
}

function getZoneColor(value: number | null, min: number, max: number) {
  if (value === null) return "#e8e2da";
  const ratio = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const lightness = 89 - ratio * 43;
  return `hsl(26, 52%, ${lightness}%)`;
}

function getZoneFill(value: number | null, min: number, max: number) {
  if (value === null) return "url(#insufficient-data)";
  return getZoneColor(value, min, max);
}

function getPriceScale(propertyType: PropertyType) {
  const values = aubagneDvfPreviewZones
    .map((zone) => zone[propertyType].medianPricePerM2)
    .filter((value): value is number => value !== null);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function buildMapZoneCollection(propertyType: PropertyType, min: number, max: number) {
  return {
    type: "FeatureCollection" as const,
    features: aubagneDvfPreviewZones.map((zone) => {
      const stat = zone[propertyType];
      return {
        type: "Feature" as const,
        properties: {
          code: zone.code,
          color: getZoneColor(stat.medianPricePerM2, min, max),
          name: zone.name,
          shortName: zone.name === "Garlaban-Royante" ? "Garlaban" : zone.name,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...zone.polygon, zone.polygon[0]]],
        },
      };
    }),
  };
}

function getMapFeatureCode(feature: unknown) {
  if (!feature || typeof feature !== "object" || !("properties" in feature)) return null;
  const properties = (feature as { properties?: { code?: unknown } }).properties;
  return typeof properties?.code === "string" ? properties.code : null;
}

export function AubagneDvfPreviewMap({
  accessToken,
  communalApartmentPrice,
  communalHousePrice,
}: AubagneDvfPreviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [activeZoneCode, setActiveZoneCode] = useState("130050701");
  const activeZone = aubagneDvfPreviewZones.find((zone) => zone.code === activeZoneCode)
    ?? aubagneDvfPreviewZones[0];
  const activeStat = activeZone[propertyType];
  const confidenceScore = getConfidenceScore(activeStat);
  const propertyLabel = propertyType === "apartment" ? "appartements" : "maisons";
  const communalPrice = propertyType === "apartment"
    ? communalApartmentPrice
    : communalHousePrice;

  const scale = useMemo(() => getPriceScale(propertyType), [propertyType]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!accessToken) {
      setMapStatus("missing-token");
      return;
    }

    let mapLoaded = false;

    try {
      mapboxgl.accessToken = accessToken;
      const initialScale = getPriceScale("apartment");
      const map = new mapboxgl.Map({
        attributionControl: true,
        center: [5.5708, 43.2965],
        container: mapContainerRef.current,
        pitch: 0,
        style: "mapbox://styles/mapbox/light-v11",
        zoom: 11.6,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");

      map.on("load", () => {
        mapLoaded = true;
        map.addSource(MAP_SOURCE_ID, {
          type: "geojson",
          data: buildMapZoneCollection("apartment", initialScale.min, initialScale.max),
        });
        map.addLayer({
          id: MAP_FILL_LAYER_ID,
          type: "fill",
          source: MAP_SOURCE_ID,
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.62,
          },
        });
        map.addLayer({
          id: MAP_LINE_LAYER_ID,
          type: "line",
          source: MAP_SOURCE_ID,
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "code"], "130050701"],
              "#2d251f",
              "#ffffff",
            ],
            "line-width": [
              "case",
              ["==", ["get", "code"], "130050701"],
              3.5,
              1.6,
            ],
          },
        });
        map.addLayer({
          id: MAP_LABEL_LAYER_ID,
          type: "symbol",
          source: MAP_SOURCE_ID,
          layout: {
            "text-allow-overlap": false,
            "text-field": ["get", "shortName"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
            "text-max-width": 10,
            "text-size": 11,
          },
          paint: {
            "text-color": "#302821",
            "text-halo-color": "rgba(255, 253, 250, 0.96)",
            "text-halo-width": 1.5,
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        aubagneDvfPreviewZones.forEach((zone) => {
          zone.polygon.forEach((point) => bounds.extend(point));
        });
        const isCompactMap = (mapContainerRef.current?.clientWidth ?? 0) <= 700;
        map.fitBounds(bounds, {
          duration: 0,
          maxZoom: 12.5,
          padding: isCompactMap
            ? { top: 24, right: 24, bottom: 58, left: 24 }
            : { top: 30, right: 245, bottom: 68, left: 34 },
        });

        map.on("click", MAP_FILL_LAYER_ID, (event) => {
          const code = getMapFeatureCode(event.features?.[0]);
          if (code) setActiveZoneCode(code);
        });
        map.on("mouseenter", MAP_FILL_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", MAP_FILL_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        setMapStatus("ready");
      });

      map.on("error", () => {
        if (!mapLoaded) setMapStatus("error");
      });
    } catch {
      setMapStatus("error");
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (mapStatus !== "ready" || !source) return;
    source.setData(buildMapZoneCollection(propertyType, scale.min, scale.max));
  }, [mapStatus, propertyType, scale.max, scale.min]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      mapStatus !== "ready"
      || !map?.getLayer(MAP_FILL_LAYER_ID)
      || !map.getLayer(MAP_LINE_LAYER_ID)
    ) return;

    map.setPaintProperty(MAP_FILL_LAYER_ID, "fill-opacity", [
      "case",
      ["==", ["get", "code"], activeZoneCode],
      0.82,
      0.58,
    ]);
    map.setPaintProperty(MAP_LINE_LAYER_ID, "line-color", [
      "case",
      ["==", ["get", "code"], activeZoneCode],
      "#2d251f",
      "#ffffff",
    ]);
    map.setPaintProperty(MAP_LINE_LAYER_ID, "line-width", [
      "case",
      ["==", ["get", "code"], activeZoneCode],
      3.5,
      1.6,
    ]);
  }, [activeZoneCode, mapStatus]);

  return (
    <section className={styles.wrapper} aria-label="Prix par quartier à Aubagne">
      <div className={styles.mapPanel}>
        <div className={styles.toolbar}>
          <div className={styles.mapTitle}>
            <span><MapPinned size={15} /> Prix par quartier</span>
            <small>Médianes DVF · {aubagneDvfAudit.observedPeriod}</small>
          </div>
          <div className={styles.controls}>
            <label className={styles.zoneSelect}>
              <span className="city-visually-hidden">Choisir une zone IRIS</span>
              <select value={activeZone.code} onChange={(event) => setActiveZoneCode(event.target.value)}>
                {aubagneDvfPreviewZones.map((zone) => (
                  <option key={`${zone.code}-option`} value={zone.code}>{zone.name}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" size={14} />
            </label>
            <div className={styles.switcher} aria-label="Type de bien">
              <button
                aria-label="Appartements"
                aria-pressed={propertyType === "apartment"}
                className={propertyType === "apartment" ? styles.activeSwitch : undefined}
                onClick={() => setPropertyType("apartment")}
                title="Appartements"
                type="button"
              >
                <Building2 size={17} /><span>Appartements</span>
              </button>
              <button
                aria-label="Maisons"
                aria-pressed={propertyType === "house"}
                className={propertyType === "house" ? styles.activeSwitch : undefined}
                onClick={() => setPropertyType("house")}
                title="Maisons"
                type="button"
              >
                <Home size={17} /><span>Maisons</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.mapCanvas}>
          <div
            aria-label="Fond cartographique Mapbox d’Aubagne"
            className={`${styles.mapboxMap} ${mapStatus === "ready" ? styles.mapboxVisible : ""}`}
            ref={mapContainerRef}
          />
          <svg
            aria-hidden={mapStatus === "ready"}
            aria-label={`Carte des prix médians des ${propertyLabel} dans les zones IRIS d’Aubagne`}
            className={`${styles.map} ${mapStatus === "ready" ? styles.mapHidden : ""}`}
            role="img"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          >
            <defs>
              <pattern height="12" id="insufficient-data" patternUnits="userSpaceOnUse" width="12">
                <rect fill="#f0ede8" height="12" width="12" />
                <path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke="#d1c9be" strokeWidth="2" />
              </pattern>
            </defs>
            {aubagneDvfPreviewZones.map((zone) => {
              const stat = zone[propertyType];
              const selected = zone.code === activeZone.code;
              return (
                <path
                  aria-label={`${zone.name} : ${stat.medianPricePerM2 === null ? "données insuffisantes" : `${euroFormatter.format(stat.medianPricePerM2)} euros par mètre carré`}`}
                  className={selected ? styles.selectedZone : styles.zone}
                  d={getPath(zone)}
                  fill={getZoneFill(stat.medianPricePerM2, scale.min, scale.max)}
                  key={zone.code}
                  onClick={() => setActiveZoneCode(zone.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setActiveZoneCode(zone.code);
                  }}
                >
                  <title>{`${zone.name} · ${stat.medianPricePerM2 === null ? "données insuffisantes" : `${euroFormatter.format(stat.medianPricePerM2)} €/m² · ${stat.observations} ventes`}`}</title>
                </path>
              );
            })}
            {aubagneDvfPreviewZones.map((zone) => {
              const [x, y] = geometry.project(zone.labelPoint);
              const selected = zone.code === activeZone.code;
              if (!selected && !FEATURED_LABELS.has(zone.name)) return null;
              const shortName = zone.name === "Garlaban-Royante" ? "Garlaban" : zone.name;
              return (
                <text
                  aria-hidden="true"
                  className={selected ? styles.selectedLabel : styles.zoneLabel}
                  key={`${zone.code}-label`}
                  x={x}
                  y={y}
                >
                  {shortName}
                </text>
              );
            })}
          </svg>

          <aside className={styles.detailPanel} aria-live="polite">
            <div className={styles.detailTopline}>
              <span>IRIS {activeZone.code}</span>
              <div
                aria-label={`Indice de confiance : ${confidenceScore} sur 5`}
                className={styles.confidenceIndex}
                data-reliability={activeStat.reliability}
              >
                <span>Indice de confiance</span>
                <i aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => <b className={index < confidenceScore ? styles.activeDot : undefined} key={index} />)}
                </i>
              </div>
            </div>
            <h3>{activeZone.name}</h3>
            <p className={styles.propertyContext}>
              {activeStat.medianPricePerM2 !== null
                ? `Prix médian des ${propertyLabel}`
                : `Données de quartier insuffisantes`}
            </p>
            {activeStat.medianPricePerM2 !== null ? (
              <>
                <strong className={styles.price}>
                  {euroFormatter.format(activeStat.medianPricePerM2)} €<small>/m²</small>
                </strong>
                <p className={styles.compactStats}>
                  <span><b>{activeStat.observations}</b> ventes comparables</span>
                  <span>Fourchette observée : <b>{euroFormatter.format(activeStat.p25PricePerM2!)} à {euroFormatter.format(activeStat.p75PricePerM2!)} €/m²</b></span>
                  {activeStat.reliability === "exploratory" ? (
                    <span className={styles.caution}>À interpréter avec prudence : faible volume de ventes.</span>
                  ) : null}
                </p>
              </>
            ) : (
              <div className={styles.communalFallback}>
                <span>Prix communal à Aubagne</span>
                <strong>{euroFormatter.format(communalPrice)} €<small>/m²</small></strong>
                <p>
                  Seulement {activeStat.observations} vente{activeStat.observations > 1 ? "s" : ""} locale{activeStat.observations > 1 ? "s" : ""} comparable{activeStat.observations > 1 ? "s" : ""}.
                  Ce montant concerne Aubagne, pas ce quartier précisément.
                </p>
              </div>
            )}
          </aside>

          <div className={styles.legend}>
            <span>{euroFormatter.format(scale.min)} €/m²</span>
            <i aria-hidden="true" />
            <span>{euroFormatter.format(scale.max)} €/m²</span>
            <small><b /> Prix communal si moins de 3 ventes</small>
          </div>
        </div>
      </div>

      <details className={styles.sourceDetails}>
        <summary>
          <span><Database size={16} /> Source et méthode</span>
          <small>DVF DGFiP · 20 zones IRIS officielles</small>
          <ChevronDown aria-hidden="true" size={16} />
        </summary>
        <div className={styles.audit}>
          <div className={styles.auditIntro}>
            <strong>D’où viennent ces prix au m² ?</strong>
            <p>
              Calcul local à partir des ventes DVF de la DGFiP, géolocalisées par data.gouv.fr,
              puis rattachées aux contours IRIS officiels IGN–INSEE. Aucun appel payant à une API
              n’est nécessaire pour calculer les prix. Mapbox fournit uniquement le fond cartographique.
            </p>
          </div>
          <dl>
            <div><dt>Lignes DVF lues</dt><dd>{countFormatter.format(aubagneDvfAudit.rawRows)}</dd></div>
            <div><dt>Mutations uniques</dt><dd>{countFormatter.format(aubagneDvfAudit.uniqueMutations)}</dd></div>
            <div><dt>Ventes comparables</dt><dd>{countFormatter.format(aubagneDvfAudit.comparableSales)}</dd></div>
            <div><dt>Dernière diffusion</dt><dd>Avril 2026</dd></div>
          </dl>
          <p className={styles.methodNote}>
            Une mutation est comptée une seule fois. Les ventes mixtes ou multiples, les surfaces
            manquantes et les valeurs atypiques sont écartées. L’indice de confiance progresse avec
            le nombre de ventes comparables : de 1 à 5 points. En dessous de 3 ventes,
            seul le prix communal est présenté.
          </p>
        </div>
      </details>
    </section>
  );
}

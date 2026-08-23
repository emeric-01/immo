"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Building2, Database, Home, Info, MapPinned } from "lucide-react";
import {
  aubagneDvfAudit,
  aubagneDvfPreviewZones,
  type AubagneDvfPreviewZone,
  type DvfIrisPriceStat,
} from "@/lib/aubagne-dvf-preview-data";
import styles from "./aubagne-dvf-preview-map.module.css";

type PropertyType = "apartment" | "house";

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const countFormatter = new Intl.NumberFormat("fr-FR");
const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 610;
const MAP_PADDING = 32;
const LONGITUDE_CORRECTION = Math.cos((43.3 * Math.PI) / 180);

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

function getReliabilityLabel(stat: DvfIrisPriceStat) {
  if (stat.reliability === "robust") return "Repère robuste";
  if (stat.reliability === "indicative") return "Repère indicatif";
  return "Données insuffisantes";
}

function getZoneFill(value: number | null, min: number, max: number) {
  if (value === null) return "url(#insufficient-data)";
  const ratio = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const lightness = 89 - ratio * 43;
  return `hsl(26 52% ${lightness}%)`;
}

export function AubagneDvfPreviewMap() {
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [activeZoneCode, setActiveZoneCode] = useState("130050701");
  const activeZone = aubagneDvfPreviewZones.find((zone) => zone.code === activeZoneCode)
    ?? aubagneDvfPreviewZones[0];
  const activeStat = activeZone[propertyType];
  const propertyLabel = propertyType === "apartment" ? "appartements" : "maisons";

  const scale = useMemo(() => {
    const values = aubagneDvfPreviewZones
      .map((zone) => zone[propertyType].medianPricePerM2)
      .filter((value): value is number => value !== null);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [propertyType]);

  return (
    <section className={styles.wrapper} aria-labelledby="aubagne-iris-title">
      <div className={styles.heading}>
        <div>
          <p><MapPinned size={16} /> Prix par quartier statistique</p>
          <h2 id="aubagne-iris-title">Les 20 zones IRIS d’Aubagne</h2>
          <span>Médianes des ventes comparables DVF · {aubagneDvfAudit.observedPeriod}</span>
        </div>
        <div className={styles.switcher} aria-label="Type de bien">
          <button
            aria-pressed={propertyType === "apartment"}
            className={propertyType === "apartment" ? styles.activeSwitch : undefined}
            onClick={() => setPropertyType("apartment")}
            type="button"
          >
            <Building2 size={17} /> Appartements
          </button>
          <button
            aria-pressed={propertyType === "house"}
            className={propertyType === "house" ? styles.activeSwitch : undefined}
            onClick={() => setPropertyType("house")}
            type="button"
          >
            <Home size={17} /> Maisons
          </button>
        </div>
      </div>

      <div className={styles.mapGrid}>
        <div className={styles.mapPanel}>
          <svg
            aria-label={`Carte des prix médians des ${propertyLabel} dans les zones IRIS d’Aubagne`}
            className={styles.map}
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
                  <title>{zone.name} · {stat.medianPricePerM2 === null ? "données insuffisantes" : `${euroFormatter.format(stat.medianPricePerM2)} €/m² · ${stat.observations} ventes`}</title>
                </path>
              );
            })}
            {aubagneDvfPreviewZones.map((zone) => {
              const [x, y] = geometry.project(zone.labelPoint);
              const selected = zone.code === activeZone.code;
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

          <div className={styles.legend}>
            <span>{euroFormatter.format(scale.min)} €/m²</span>
            <i aria-hidden="true" />
            <span>{euroFormatter.format(scale.max)} €/m²</span>
            <small><b /> Échantillon insuffisant</small>
          </div>
        </div>

        <aside className={styles.detailPanel} aria-live="polite">
          <div className={styles.detailTopline}>
            <span>IRIS {activeZone.code}</span>
            <em data-reliability={activeStat.reliability}>{getReliabilityLabel(activeStat)}</em>
          </div>
          <h3>{activeZone.name}</h3>
          <p className={styles.propertyContext}>Prix médian des {propertyLabel}</p>
          {activeStat.medianPricePerM2 !== null ? (
            <>
              <strong className={styles.price}>
                {euroFormatter.format(activeStat.medianPricePerM2)} €<small>/m²</small>
              </strong>
              <dl className={styles.zoneStats}>
                <div><dt>Ventes comparables</dt><dd>{activeStat.observations}</dd></div>
                <div>
                  <dt>50 % des ventes</dt>
                  <dd>{euroFormatter.format(activeStat.p25PricePerM2!)}–{euroFormatter.format(activeStat.p75PricePerM2!)} €/m²</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className={styles.insufficientCard}>
              <Info size={19} />
              <p>
                Seulement {activeStat.observations} vente{activeStat.observations > 1 ? "s" : ""} comparable{activeStat.observations > 1 ? "s" : ""}.
                Aucun prix n’est publié pour éviter un repère trompeur.
              </p>
            </div>
          )}
          <p className={styles.contextNote}>
            Une médiane de quartier situe le marché. La rue, l’état, la parcelle,
            l’exposition et les prestations restent déterminants.
          </p>
        </aside>
      </div>

      <div className={styles.zonePicker}>
        <p>Choisir une zone IRIS</p>
        <div>
          {aubagneDvfPreviewZones.map((zone) => {
            const stat = zone[propertyType];
            return (
              <button
                aria-pressed={zone.code === activeZone.code}
                key={`${zone.code}-picker`}
                onClick={() => setActiveZoneCode(zone.code)}
                style={{ "--zone-dot": getZoneFill(stat.medianPricePerM2, scale.min, scale.max) } as CSSProperties}
                type="button"
              >
                <i />
                <span>{zone.name}</span>
                <small>{stat.medianPricePerM2 === null ? "—" : `${euroFormatter.format(stat.medianPricePerM2)} €`}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.audit}>
        <div className={styles.auditIntro}>
          <Database size={20} />
          <div>
            <strong>D’où viennent ces prix au m² ?</strong>
            <p>
              Calcul local à partir des ventes DVF de la DGFiP, géolocalisées par data.gouv.fr,
              puis rattachées aux contours IRIS officiels IGN–INSEE. Aucun appel payant à une API
              n’est nécessaire pour afficher cette carte.
            </p>
          </div>
        </div>
        <dl>
          <div><dt>Lignes DVF lues</dt><dd>{countFormatter.format(aubagneDvfAudit.rawRows)}</dd></div>
          <div><dt>Mutations uniques</dt><dd>{countFormatter.format(aubagneDvfAudit.uniqueMutations)}</dd></div>
          <div><dt>Ventes comparables</dt><dd>{countFormatter.format(aubagneDvfAudit.comparableSales)}</dd></div>
          <div><dt>Dernière diffusion</dt><dd>Avril 2026</dd></div>
        </dl>
        <p className={styles.methodNote}>
          Une mutation est comptée une seule fois. Les ventes mixtes ou multiples, les surfaces
          manquantes et les valeurs atypiques sont écartées. Seuils : prix robuste dès 15 ventes,
          indicatif de 8 à 14, non publié en dessous de 8.
        </p>
      </div>
    </section>
  );
}

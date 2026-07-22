"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock3, LockKeyhole, MapPin, Tag } from "lucide-react";
import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  AddressSuggestion,
  PropertyEstimation,
  PropertyEstimationInput,
  RealtyType,
} from "@/lib/immo-data";
import { MIN_ADDRESS_QUERY_LENGTH } from "@/lib/immo-data";

type FormState = {
  address: string;
  propertyType: RealtyType;
  surfaceM2: string;
  rooms: string;
  condition: "" | NonNullable<PropertyEstimationInput["condition"]>;
  dpe: "" | NonNullable<PropertyEstimationInput["dpe"]>;
  bathrooms: string;
  constructionYear: string;
  buildingLevels: string;
  floor: string;
  landAreaM2: string;
  hasOutdoorSpace: boolean;
  hasParking: boolean;
  hasElevator: boolean;
  hasCellar: boolean;
  hasPool: boolean;
  hasNiceView: boolean;
};

type FlowStep = "address" | "essential" | "refine" | "result";

type PropertyEstimationResponse = PropertyEstimation & {
  clientEstimationId?: string | null;
  savedToClientAccount?: boolean;
};

type LocationHint = {
  city?: string;
  region?: string;
  country?: string;
};

const surfaceMin = 9;
const surfaceMax = 300;
const defaultSurface = 75;
const roomOptions = ["1", "2", "3", "4", "5", "6"] as const;

const initialForm: FormState = {
  address: "",
  propertyType: "apartment",
  surfaceM2: String(defaultSurface),
  rooms: "3",
  condition: "",
  dpe: "",
  bathrooms: "",
  constructionYear: "",
  buildingLevels: "",
  floor: "",
  landAreaM2: "",
  hasOutdoorSpace: false,
  hasParking: false,
  hasElevator: false,
  hasCellar: false,
  hasPool: false,
  hasNiceView: false,
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");
const quickCriteria = [
  ["hasOutdoorSpace", "Exterieur", "outdoor"],
  ["hasParking", "Parking", "parking"],
  ["hasCellar", "Cave", "cellar"],
  ["hasNiceView", "Belle vue", "view"],
] as const;
const propertyIconPaths: Record<RealtyType, string> = {
  apartment: "/icons/estimation/building.svg",
  house: "/icons/estimation/home.svg",
};
const assetIconPaths = {
  outdoor: "/icons/estimation/trees.svg",
  parking: "/icons/estimation/car.svg",
  cellar: "/icons/estimation/basement.svg",
  view: "/icons/estimation/landscape.svg",
  pool: "/icons/estimation/swimming-pool.svg",
  elevator: "/icons/estimation/building.svg",
} as const;
const conditionLabels: Record<NonNullable<PropertyEstimationInput["condition"]>, string> = {
  new: "Excellent etat",
  good: "Bon etat",
  refresh: "A rafraichir",
  renovate: "A renover",
};

function optionalNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function clampSurface(value: string) {
  const surface = Number(value);

  if (!Number.isFinite(surface)) {
    return defaultSurface;
  }

  return Math.min(surfaceMax, Math.max(surfaceMin, Math.round(surface)));
}

function formatDistance(distance?: number) {
  if (distance === undefined) {
    return "Secteur proche";
  }

  if (distance >= 1000) {
    return `${(distance / 1000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} km`;
  }

  return `${numberFormatter.format(distance)} m`;
}

function formatSoldAt(date?: string) {
  if (!date) {
    return "Date NC";
  }

  const [year, month] = date.split("-");

  return month && year ? `${month}/${year}` : date;
}

function buildTrendPath(points: Array<{ value: number }>) {
  if (points.length < 2) {
    return "";
  }

  const width = 220;
  const height = 64;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

type EstimationFormProps = {
  initialAddress?: AddressSuggestion;
  initialPropertyType?: RealtyType;
  initialRooms?: number;
  initialSurfaceM2?: number;
};

export function EstimationForm({
  initialAddress,
  initialPropertyType,
  initialRooms,
  initialSurfaceM2,
}: EstimationFormProps) {
  const [step, setStep] = useState<FlowStep>(initialAddress ? "essential" : "address");
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    address: initialAddress?.label ?? "",
    propertyType: initialPropertyType ?? initialForm.propertyType,
    rooms: initialRooms && initialRooms > 0 ? String(initialRooms) : initialForm.rooms,
    surfaceM2: initialSurfaceM2 && initialSurfaceM2 > 0
      ? String(clampSurface(String(initialSurfaceM2)))
      : initialForm.surfaceM2,
  }));
  const [selectedAddress, setSelectedAddress] =
    useState<AddressSuggestion | null>(initialAddress ?? null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [locationHint, setLocationHint] = useState<LocationHint | null>(null);
  const [estimation, setEstimation] = useState<PropertyEstimationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTypedAddress, setHasTypedAddress] = useState(false);
  const addressAbortRef = useRef<AbortController | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.address.trim().length > 4 &&
      Number(form.surfaceM2) > 0 &&
      Number(form.rooms) > 0
    );
  }, [form.address, form.rooms, form.surfaceM2]);
  const canContinueEssential = canSubmit && Boolean(form.condition);

  const canOpenDetails = selectedAddress?.label === form.address.trim();
  const addressPlaceholder = locationHint?.city
    ? `Entrez une adresse (ex : 12 rue de la Republique, ${locationHint.city})`
    : "Entrez une adresse (ex : 12 rue de la Paix, 75002 Paris)";
  const surfaceValue = clampSurface(form.surfaceM2);
  const surfaceProgress =
    ((surfaceValue - surfaceMin) / (surfaceMax - surfaceMin)) * 100;
  const surfaceRangeStyle = {
    "--range-progress": `${surfaceProgress}%`,
  } as CSSProperties;

  useEffect(() => {
    let ignore = false;

    async function fetchLocationHint() {
      try {
        const response = await fetch("/api/location-hint");
        const data = (await response.json()) as LocationHint;

        if (!ignore) {
          setLocationHint(data);
        }
      } catch {
        if (!ignore) {
          setLocationHint({});
        }
      }
    }

    fetchLocationHint();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const query = form.address.trim();

    if (!hasTypedAddress) {
      setSuggestions([]);
      setAddressError(null);
      setIsAddressLoading(false);
      return;
    }

    if (selectedAddress?.label === query) {
      return;
    }

    setSelectedAddress(null);

    if (query.length < MIN_ADDRESS_QUERY_LENGTH) {
      setSuggestions([]);
      setAddressError(null);
      setIsAddressLoading(false);
      addressAbortRef.current?.abort();
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      addressAbortRef.current?.abort();
      const controller = new AbortController();
      addressAbortRef.current = controller;
      setIsAddressLoading(true);
      setAddressError(null);

      try {
        const response = await fetch(
          `/api/addresses?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Recherche indisponible.");
        }

        setSuggestions(data as AddressSuggestion[]);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }

        setSuggestions([]);
        setAddressError(
          searchError instanceof Error
            ? searchError.message
            : "Recherche indisponible.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsAddressLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form.address, hasTypedAddress, selectedAddress]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEstimation(null);
    setIsLoading(true);

    const payload: PropertyEstimationInput = {
      address: form.address.trim(),
      selectedAddress: selectedAddress ?? undefined,
      propertyType: form.propertyType,
      surfaceM2: Number(form.surfaceM2),
      rooms: Number(form.rooms),
      condition: form.condition || undefined,
      dpe: form.dpe || undefined,
      bathrooms: optionalNumber(form.bathrooms),
      constructionYear: optionalNumber(form.constructionYear),
      buildingLevels:
        form.propertyType === "apartment"
          ? optionalNumber(form.buildingLevels)
          : undefined,
      floor:
        form.propertyType === "apartment" ? optionalNumber(form.floor) : undefined,
      landAreaM2:
        form.propertyType === "house" ? optionalNumber(form.landAreaM2) : undefined,
      hasOutdoorSpace: form.hasOutdoorSpace,
      hasParking: form.hasParking,
      hasElevator:
        form.propertyType === "apartment" ? form.hasElevator : undefined,
      hasCellar: form.hasCellar,
      hasPool: form.propertyType === "house" ? form.hasPool : undefined,
      hasNiceView: form.hasNiceView,
    };

    try {
      const response = await fetch("/api/estimations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Vous avez atteint la limite de 5 estimations par heure. Réessayez un peu plus tard ou contactez directement l’agence.",
          );
        }

        throw new Error(data?.error ?? "Estimation indisponible.");
      }

      setEstimation(data as PropertyEstimationResponse);
      setStep("result");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Estimation indisponible.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const addressField = (
    <label className="address-label">
      {step === "refine" ? "Adresse du bien" : null}
      <div className="address-combobox">
        <input
          name="address"
          autoComplete="street-address"
          required
          value={form.address}
          onChange={(event) => {
            setHasTypedAddress(true);
            setForm((current) => ({
              ...current,
              address: event.target.value,
            }));
          }}
          placeholder={addressPlaceholder}
        />
        <span className="address-status">
          {isAddressLoading
            ? "Recherche..."
            : selectedAddress
              ? "Adresse selectionnee"
              : "Selectionnez une adresse proposee"}
        </span>
        {suggestions.length > 0 && !selectedAddress ? (
          <div className="suggestions-list" role="listbox">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={`${suggestion.addressId ?? suggestion.label}-${suggestion.longitude}`}
                onClick={() => {
                  setSelectedAddress(suggestion);
                  setSuggestions([]);
                  setHasTypedAddress(false);
                  setForm((current) => ({
                    ...current,
                    address: suggestion.label,
                  }));
                }}
              >
                <strong>{suggestion.label}</strong>
                {suggestion.cityName ? <span>{suggestion.cityName}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {addressError ? (
        <span className="field-hint warning">{addressError}</span>
      ) : step === "refine" ? (
        <span className="field-hint">
          Recherche dans la Base Adresse Nationale des les 3 premiers caracteres.
        </span>
      ) : null}
    </label>
  );

  if (step === "address") {
    return (
      <main className="estimation-page">
        <section className="address-step estimation-shell" aria-labelledby="address-step-title">
          <div className="address-hero">
            <p className="estimation-kicker">Estimation immobilière</p>
            <h1 id="address-step-title">Quelle est la valeur de votre bien&nbsp;?</h1>
            <p>
              Obtenez une première estimation en quelques minutes, affinée par
              notre expertise locale.
            </p>
          </div>

          <div className="address-progress" aria-label="Étape 1 sur 4">
            <div className="address-progress-bars" aria-hidden="true">
              <span className="active" />
              <span />
              <span />
              <span />
            </div>
            <span>Étape 1 sur 4</span>
          </div>

          <form
            className="address-search-card"
            onSubmit={(event) => {
              event.preventDefault();

              if (canOpenDetails) {
                setStep("essential");
              }
            }}
          >
            <div className="address-card-heading">
              <h2>Commençons par l&apos;adresse</h2>
              <p>Elle nous permet d&apos;analyser précisément votre secteur.</p>
            </div>

            <div className="address-entry">
              <span className="address-entry-label">
                Adresse du bien <em>Obligatoire</em>
              </span>
              <div className="address-search-row">
                <MapPin aria-hidden="true" />
                {addressField}
              </div>
              {!selectedAddress ? (
                <small className="address-entry-help">
                  Saisissez puis sélectionnez votre adresse dans la liste proposée.
                </small>
              ) : null}
            </div>

            {selectedAddress ? (
              <div className="selected-address-row" aria-live="polite">
                <MapPin aria-hidden="true" />
                <strong>{selectedAddress.label}</strong>
                <Check aria-hidden="true" />
              </div>
            ) : null}

            <button className="estimate-button" disabled={!canOpenDetails}>
              Continuer
              <ArrowRight aria-hidden="true" />
            </button>
          </form>

          <ul className="estimation-reassurance" aria-label="Les garanties de l'estimation">
            <li>
              <Clock3 aria-hidden="true" />
              <span><strong>2 minutes</strong> seulement</span>
            </li>
            <li>
              <Tag aria-hidden="true" />
              <span><strong>100 % gratuit</strong> et sans engagement</span>
            </li>
            <li>
              <LockKeyhole aria-hidden="true" />
              <span><strong>Données protégées</strong> et confidentielles</span>
            </li>
          </ul>
        </section>
      </main>
    );
  }

  if (step === "essential") {
    return (
      <main className="estimation-page">
        <section className="details-step essential-step estimation-shell" aria-labelledby="essential-title">
        <div className="stepper" aria-label="Progression de l'estimation">
          <div className="stepper-item active">
            <span>1</span>
            <div>
              <strong>Informations essentielles</strong>
              <small>Etape 1 sur 2</small>
            </div>
          </div>
          <div className="stepper-item">
            <span>2</span>
            <div>
              <strong>Affiner l&apos;estimation</strong>
              <small>Optionnel</small>
            </div>
          </div>
        </div>

        <form
          className="essential-card"
          onSubmit={(event) => {
            event.preventDefault();

            if (canContinueEssential) {
              setStep("refine");
            }
          }}
        >
          <div className="module-heading">
            <h2 id="essential-title">Decrivez votre bien</h2>
            <p>Ces informations nous permettent d&apos;estimer votre bien.</p>
          </div>

          <div className="segmented-control property-switch" aria-label="Type de bien">
            {(["apartment", "house"] as const).map((type) => (
              <button
                type="button"
                className={form.propertyType === type ? "selected" : ""}
                key={type}
                onClick={() =>
                  setForm((current) => ({ ...current, propertyType: type }))
                }
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className="property-svg"
                  height={21}
                  src={propertyIconPaths[type]}
                  width={21}
                />
                {type === "apartment" ? "Appartement" : "Maison"}
              </button>
            ))}
          </div>

          <div className="property-tuning">
            <section className="range-field" aria-labelledby="surface-title">
              <div className="range-field-header">
                <span className="field-title" id="surface-title">
                  Surface <span className="field-help" aria-label="Surface habitable">?</span>
                </span>
                <strong>
                  {numberFormatter.format(surfaceValue)} <span>m2</span>
                </strong>
              </div>
              <input
                aria-labelledby="surface-title"
                className="surface-range"
                max={surfaceMax}
                min={surfaceMin}
                name="surface"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    surfaceM2: event.target.value,
                  }))
                }
                step="1"
                style={surfaceRangeStyle}
                type="range"
                value={surfaceValue}
              />
              <div className="range-bounds" aria-hidden="true">
                <span>{surfaceMin} m2</span>
                <span>{surfaceMax} m2</span>
              </div>
            </section>

            <section className="room-picker" aria-labelledby="rooms-title">
              <span className="field-title" id="rooms-title">
                Nombre de pieces
              </span>
              <div className="room-options" role="group" aria-labelledby="rooms-title">
                {roomOptions.map((room) => (
                  <button
                    aria-pressed={form.rooms === room}
                    className={form.rooms === room ? "selected" : ""}
                    key={room}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        rooms: room,
                      }))
                    }
                    type="button"
                  >
                    {room === "6" ? "6+" : room}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <label>
            Etat du bien
            <select
              value={form.condition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condition: event.target.value as FormState["condition"],
                }))
              }
            >
              <option value="">Selectionner</option>
              <option value="new">Excellent etat</option>
              <option value="good">Bon etat</option>
              <option value="refresh">A rafraichir</option>
              <option value="renovate">A renover</option>
            </select>
          </label>

          <button
            className="primary-action continue-action"
            disabled={!canContinueEssential}
          >
            Continuer
            <span aria-hidden="true">-&gt;</span>
          </button>

          {error ? <p className="form-error">{error}</p> : null}

          <p className="privacy-note essential-privacy">
            <span className="privacy-lock" aria-hidden="true" />
            Vos donnees sont protegees et ne seront jamais revendues.
          </p>
        </form>
        </section>
      </main>
    );
  }

  if (step === "result" && estimation) {
    const propertyLabel = form.propertyType === "house" ? "Maison" : "Appartement";
    const resultChips = [
      propertyLabel,
      `${numberFormatter.format(Number(form.surfaceM2))} m2`,
      `${numberFormatter.format(Number(form.rooms))} pieces`,
      form.condition ? conditionLabels[form.condition] : undefined,
      form.hasOutdoorSpace ? "Exterieur" : undefined,
      form.hasParking ? "Parking" : undefined,
      form.hasCellar ? "Cave" : undefined,
      form.hasNiceView ? "Belle vue" : undefined,
      form.propertyType === "apartment" && form.hasElevator ? "Ascenseur" : undefined,
      form.propertyType === "house" && form.hasPool ? "Piscine" : undefined,
    ].filter((chip): chip is string => Boolean(chip));
    const market = estimation.market;
    const priceAdvice =
      market?.sectorPricePerM2 && estimation.pricePerM2 > market.sectorPricePerM2 * 1.08
        ? "Prix ambitieux vs secteur"
        : market?.sectorPricePerM2 &&
            estimation.pricePerM2 < market.sectorPricePerM2 * 0.92
          ? "Prix attractif vs secteur"
          : "Prix coherent marche";
    const refreshPotential =
      form.condition === "refresh" || form.condition === "renovate"
        ? Math.max(8000, Math.round(estimation.medianPrice * 0.04))
        : 0;
    const priceHistory = market?.priceHistory ?? [];
    const trendPath = buildTrendPath(priceHistory);
    const firstTrendPoint = priceHistory[0];
    const lastTrendPoint = priceHistory[priceHistory.length - 1];
    const sectorPrice = market?.sectorPricePerM2;
    const sectorDifference = sectorPrice
      ? ((estimation.pricePerM2 - sectorPrice) / sectorPrice) * 100
      : undefined;
    const rangeWidth = Math.max(1, estimation.highPrice - estimation.lowPrice);
    const medianPosition = Math.min(
      100,
      Math.max(0, ((estimation.medianPrice - estimation.lowPrice) / rangeWidth) * 100),
    );
    const strategyScenarios = [
      {
        label: "Vente dynamique",
        price: Math.round(estimation.lowPrice + rangeWidth * 0.18),
        detail: "Maximiser les contacts dès le lancement",
      },
      {
        label: "Prix recommandé",
        price: estimation.medianPrice,
        detail: "Le meilleur équilibre prix / délai",
        recommended: true,
      },
      {
        label: "Positionnement ambitieux",
        price: Math.round(estimation.highPrice - rangeWidth * 0.12),
        detail: "Tester le haut du marché avec exigence",
      },
    ];

    return (
      <main className="estimation-page">
        <section className="result-page estimation-shell" aria-labelledby="result-title">
        <header className="result-topbar">
          <button
            type="button"
            className="back-button"
            onClick={() => setStep("essential")}
          >
            Retour
          </button>
        </header>

        <div className="result-status">
          <span className="status-check" aria-hidden="true" />
          Resultat de l&apos;estimation
        </div>
        <div className="result-account-note" data-saved={estimation.savedToClientAccount || undefined}>
          {estimation.savedToClientAccount ? (
            <span>Cette estimation est enregistrée dans votre espace client.</span>
          ) : (
            <span>
              <Link href="/client/login">Connectez-vous à votre espace client</Link> avant une prochaine estimation pour la conserver.
            </span>
          )}
        </div>

        <div className="result-layout">
          <section className="valuation-card" aria-labelledby="result-title">
            <div className="valuation-main">
              <span className="result-source">
                {estimation.source === "immo-data" ? "Analyse Immo Data" : "Mode démonstration"}
              </span>
              <p className="result-address">{estimation.addressLabel}</p>
              <p className="valuation-kicker">Notre avis de valeur</p>
              <h1 id="result-title">Un prix juste, défendable sur le marché</h1>
              <strong className="result-price">
                {currencyFormatter.format(estimation.medianPrice)}
              </strong>
              <p className="result-range">
                Fourchette de marché : {currencyFormatter.format(estimation.lowPrice)} à{" "}
                {currencyFormatter.format(estimation.highPrice)}
              </p>
              <div className="valuation-scale" aria-label="Position du prix recommandé dans la fourchette">
                <div className="valuation-track">
                  <span className="valuation-fill" style={{ width: `${medianPosition}%` }} />
                  <span className="valuation-marker" style={{ left: `${medianPosition}%` }} />
                </div>
                <div><span>{currencyFormatter.format(estimation.lowPrice)}</span><strong>Prix recommandé</strong><span>{currencyFormatter.format(estimation.highPrice)}</span></div>
              </div>
            </div>
            <aside className="valuation-proof">
              <p>Pourquoi ce prix ?</p>
              <article><strong>{numberFormatter.format(estimation.pricePerM2)} €</strong><span>Prix estimé au m²</span></article>
              <article><strong>{estimation.comparables.length}</strong><span>Ventes comparables analysées</span></article>
              <article><strong>{estimation.confidenceScore}/5</strong><span>Indice de fiabilité</span></article>
              <small>Données locales, caractéristiques du bien et ventes enregistrées sur le secteur.</small>
            </aside>
          </section>

          <section className="result-card summary-card" aria-labelledby="summary-title">
            <div className="section-heading">
              <h2 id="summary-title">Resume du bien</h2>
            </div>
            <div className="summary-chips">
              {resultChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          </section>

          <section className="result-card comparables-card" aria-labelledby="comparables-title">
            <div className="section-heading inline">
              <div><span className="section-index">02 — PREUVES DE MARCHÉ</span><h2 id="comparables-title">Les ventes qui fondent notre estimation</h2></div>
              <span>{estimation.comparables.length} références à proximité</span>
            </div>
            <div className="comparable-list">
              {estimation.comparables.length > 0 ? (
                estimation.comparables.map((sale) => (
                  <article className="comparable-row" key={sale.id}>
                    <span className="comparable-thumb" aria-hidden="true" />
                    <div>
                      <strong>{sale.label}</strong>
                      <span>
                        {sale.surfaceM2 ? `${sale.surfaceM2} m2` : "Surface NC"}
                        {" · "}
                        {sale.pricePerM2
                          ? `${numberFormatter.format(sale.pricePerM2)} EUR/m2`
                          : "Prix/m2 NC"}
                        {" · "}
                        {formatDistance(sale.distanceMeters)}
                      </span>
                    </div>
                    <div>
                      <strong>{currencyFormatter.format(sale.price)}</strong>
                      <span>{formatSoldAt(sale.soldAt)}</span>
                    </div>
                    {sale.pricePerM2 ? (
                      <div className="comparable-bar" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, Math.max(18, (sale.pricePerM2 / Math.max(estimation.pricePerM2, sectorPrice ?? 0, sale.pricePerM2)) * 100))}%` }} />
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="empty-small">Aucun comparable disponible sur ce secteur.</p>
              )}
            </div>
          </section>

          <aside className="result-side">
            <section className="result-card market-card" aria-labelledby="market-title">
              <span className="section-index">01 — VOTRE MICRO-MARCHÉ</span>
              <h2 id="market-title">Le marché en un coup d&apos;œil</h2>
              <p className="market-intro">Ce que les acheteurs voient aujourd&apos;hui autour de votre bien.</p>
              <div className="price-trend">
                <div className="price-trend-heading">
                  <span>Évolution sur 12 mois</span>
                  <strong>
                    {market?.priceEvolution12Months !== undefined
                      ? `${market.priceEvolution12Months > 0 ? "+" : ""}${market.priceEvolution12Months} %`
                      : "Indisponible"}
                  </strong>
                </div>
                {trendPath ? (
                  <svg
                    aria-label="Courbe d'evolution des prix"
                    className="price-trend-chart"
                    role="img"
                    viewBox="0 0 220 72"
                  >
                    <path d="M 0 68 H 220" />
                    <path d={trendPath} />
                  </svg>
                ) : (
                  <p className="empty-small">Historique indisponible sur ce secteur.</p>
                )}
                {firstTrendPoint && lastTrendPoint ? (
                  <div className="price-trend-footer">
                    <span>{firstTrendPoint.period}</span>
                    <span>{numberFormatter.format(lastTrendPoint.value)} EUR/m2</span>
                  </div>
                ) : null}
              </div>
              <div className="market-grid">
                <article>
                  <span>Prix du secteur</span>
                  <strong>
                    {market?.sectorPricePerM2
                      ? `${numberFormatter.format(market.sectorPricePerM2)} EUR/m2`
                      : "Indisponible"}
                  </strong>
                </article>
                <article>
                  <span>Demande locale</span>
                  <strong>{market?.demandLevel ?? "Indisponible"}</strong>
                </article>
                <article>
                  <span>Délai observé</span>
                  <strong>
                    {market?.saleDurationDays
                      ? `${market.saleDurationDays} jours`
                      : "Indisponible"}
                  </strong>
                </article>
              </div>
              {sectorDifference !== undefined ? (
                <div className="market-verdict">
                  <strong>{sectorDifference >= 0 ? "+" : ""}{sectorDifference.toFixed(1)} %</strong>
                  <span>Votre bien vs prix moyen du secteur</span>
                </div>
              ) : null}
            </section>
          </aside>

          <section className="result-card meaning-card" aria-labelledby="meaning-title">
            <div className="section-heading strategy-heading">
              <span className="section-index">03 — STRATÉGIE DE VENTE</span>
              <h2 id="meaning-title">À quel prix lancer votre bien ?</h2>
              <p>Trois positionnements possibles. Notre recommandation privilégie la valeur sans ralentir la vente.</p>
            </div>
            <div className="strategy-grid">
              {strategyScenarios.map((scenario) => (
                <article className={scenario.recommended ? "recommended" : ""} key={scenario.label}>
                  {scenario.recommended ? <span className="recommendation-badge">Recommandé</span> : null}
                  <span>{scenario.label}</span>
                  <strong>{currencyFormatter.format(scenario.price)}</strong>
                  <p>{scenario.detail}</p>
                </article>
              ))}
            </div>
            <div className="seller-takeaway"><span>Notre lecture</span><strong>{priceAdvice}</strong><p>{market?.saleDurationDays ? `Le marché local absorbe actuellement les biens en environ ${market.saleDurationDays} jours.` : "Le délai sera précisé après l'analyse terrain de nos expertes."} {refreshPotential ? `Un potentiel de valorisation d'environ ${currencyFormatter.format(refreshPotential)} reste à confirmer sur place.` : "La présentation et le lancement seront déterminants pour défendre ce prix."}</p></div>
          </section>

          <div className="result-actions">
            <button className="primary-action report-action">
              Recevoir mon avis de valeur complet
              <span>Analyse détaillée, ventes témoins et stratégie</span>
            </button>
            <button className="secondary-action">
              Échanger avec une experte locale
              <span>15 minutes pour challenger cette estimation</span>
            </button>
          </div>

          <p className="privacy-note result-privacy">
            <span className="privacy-lock" aria-hidden="true" />
            Vos donnees sont protegees. Aucune revente de donnees.
          </p>
        </div>
        </section>
      </main>
    );
  }

  return (
    <main className="estimation-page">
      <section className="details-step estimation-shell refine-step" aria-labelledby="estimation-title">
        <div className="stepper" aria-label="Progression de l'estimation">
          <div className="stepper-item completed">
            <span><Check aria-hidden="true" /></span>
            <div>
              <strong>Informations essentielles</strong>
              <small>Complétées</small>
            </div>
          </div>
          <div className="stepper-item active">
            <span>2</span>
            <div>
              <strong>Affiner l&apos;estimation</strong>
              <small>Étape 2 sur 2 · optionnelle</small>
            </div>
          </div>
        </div>

        <form className="essential-card refine-card" onSubmit={handleSubmit}>
          <button type="button" className="back-button refine-back" onClick={() => setStep("essential")}>
            ← Modifier les informations essentielles
          </button>

          <div className="module-heading">
            <p className="eyebrow">
              {form.propertyType === "apartment" ? "Appartement" : "Maison"}
            </p>
            <h2 id="estimation-title">Quelques précisions utiles</h2>
            <p>Renseignez uniquement ce que vous connaissez. Tous ces champs sont facultatifs.</p>
          </div>

          <div className="advanced-grid refine-fields">
            {form.propertyType === "house" ? (
              <label>
                Surface du terrain
                <span className="input-unit">
                  <input
                    inputMode="decimal"
                    value={form.landAreaM2}
                    onChange={(event) => setForm((current) => ({ ...current, landAreaM2: event.target.value }))}
                    placeholder="Ex. 500"
                  />
                  m2
                </span>
              </label>
            ) : (
              <>
                <label>
                  Étage du bien
                  <input
                    inputMode="numeric"
                    value={form.floor}
                    onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))}
                    placeholder="Ex. 2"
                  />
                </label>
                <label>
                  Nombre d&apos;étages de l&apos;immeuble
                  <input
                    inputMode="numeric"
                    value={form.buildingLevels}
                    onChange={(event) => setForm((current) => ({ ...current, buildingLevels: event.target.value }))}
                    placeholder="Ex. 5"
                  />
                </label>
              </>
            )}

            <label>
              Année de construction
              <input
                inputMode="numeric"
                value={form.constructionYear}
                onChange={(event) => setForm((current) => ({ ...current, constructionYear: event.target.value }))}
                placeholder="Ex. 2010"
              />
            </label>

            <label>
              Salles de bains
              <input
                inputMode="numeric"
                value={form.bathrooms}
                onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))}
                placeholder="Ex. 1"
              />
            </label>

            <label>
              Classe énergétique (DPE)
              <select
                value={form.dpe}
                onChange={(event) => setForm((current) => ({ ...current, dpe: event.target.value as FormState["dpe"] }))}
              >
                <option value="">Non renseignée</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((dpe) => (
                  <option value={dpe} key={dpe}>{dpe}</option>
                ))}
              </select>
            </label>
          </div>

          <section className="asset-section" aria-label="Atouts du bien">
            <div className="asset-heading">
              <strong>Atouts du bien</strong>
              <span>Sélectionnez uniquement les éléments présents.</span>
            </div>
            <div className="asset-grid refine-assets">
              {quickCriteria
                .filter(([key]) => form.propertyType === "apartment" || key !== "hasOutdoorSpace")
                .map(([key, label, icon]) => (
                  <label className={form[key] ? "asset-pill selected" : "asset-pill"} key={key}>
                    <Image alt="" aria-hidden="true" className="asset-svg" height={20} src={assetIconPaths[icon]} width={20} />
                    <span>{form.propertyType === "apartment" && key === "hasOutdoorSpace" ? "Terrasse" : label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                  </label>
                ))}

              {form.propertyType === "apartment" ? (
                <label className={form.hasElevator ? "asset-pill selected" : "asset-pill"}>
                  <Image alt="" aria-hidden="true" className="asset-svg" height={20} src={assetIconPaths.elevator} width={20} />
                  <span>Ascenseur</span>
                  <input type="checkbox" checked={form.hasElevator} onChange={(event) => setForm((current) => ({ ...current, hasElevator: event.target.checked }))} />
                </label>
              ) : (
                <label className={form.hasPool ? "asset-pill selected" : "asset-pill"}>
                  <Image alt="" aria-hidden="true" className="asset-svg" height={20} src={assetIconPaths.pool} width={20} />
                  <span>Piscine</span>
                  <input type="checkbox" checked={form.hasPool} onChange={(event) => setForm((current) => ({ ...current, hasPool: event.target.checked }))} />
                </label>
              )}
            </div>
          </section>

          <button className="primary-action continue-action" disabled={!canSubmit || isLoading}>
            {isLoading ? "Estimation en cours" : "Estimer mon bien"}
            <span aria-hidden="true">-&gt;</span>
          </button>

          <p className="optional-submit-note">Vous pouvez lancer l&apos;estimation même si aucun champ facultatif n&apos;est renseigné.</p>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

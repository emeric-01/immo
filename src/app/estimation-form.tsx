"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type LocationHint = {
  city?: string;
  region?: string;
  country?: string;
};

const initialForm: FormState = {
  address: "",
  propertyType: "apartment",
  surfaceM2: "",
  rooms: "",
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

export function EstimationForm() {
  const [step, setStep] = useState<FlowStep>("address");
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedAddress, setSelectedAddress] =
    useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [locationHint, setLocationHint] = useState<LocationHint | null>(null);
  const [estimation, setEstimation] = useState<PropertyEstimation | null>(null);
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

  const canOpenDetails = form.address.trim().length > 4;
  const addressPlaceholder = locationHint?.city
    ? `Entrez une adresse (ex : 12 rue de la Republique, ${locationHint.city})`
    : "Entrez une adresse (ex : 12 rue de la Paix, 75002 Paris)";

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Estimation indisponible.");
      }

      setEstimation(data as PropertyEstimation);
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
              : "Saisie libre possible"}
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
          Recherche Immo Data a partir de 10 caracteres.
        </span>
      ) : null}
    </label>
  );

  if (step === "address") {
    return (
      <section className="address-step" aria-labelledby="address-step-title">
        <div className="brand-lockup" aria-label="ImmoSafe">
          <span className="brand-shield" />
          <strong>
            Immo<span>Safe</span>
          </strong>
        </div>

        <div className="address-hero">
          <h1 id="address-step-title">
            Estimez votre bien immobilier en toute confiance
          </h1>
          <p>Rapide, gratuit et sans engagement.</p>
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
          <div className="address-search-row">
            <span className="search-icon" aria-hidden="true" />
            {addressField}
            <button className="estimate-button" disabled={!canOpenDetails}>
              Estimer
            </button>
          </div>
        </form>

        <p className="privacy-note">
          <span className="privacy-lock" aria-hidden="true" />
          Vos donnees sont protegees (RGPD) et ne seront jamais revendues.
        </p>
      </section>
    );
  }

  if (step === "essential") {
    return (
      <section className="details-step essential-step" aria-labelledby="essential-title">
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
          onSubmit={handleSubmit}
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
                <span className={`property-icon ${type}`} aria-hidden="true" />
                {type === "apartment" ? "Appartement" : "Maison"}
              </button>
            ))}
          </div>

          <div className="form-grid">
            <label>
              <span className="field-title">
                Surface <span className="field-help" aria-label="Surface habitable">?</span>
              </span>
              <span className="input-unit">
                <input
                  inputMode="decimal"
                  name="surface"
                  value={form.surfaceM2}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      surfaceM2: event.target.value,
                    }))
                  }
                />
                m2
              </span>
            </label>

            <label>
              Nombre de pieces
              <input
                inputMode="numeric"
                name="rooms"
                value={form.rooms}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rooms: event.target.value,
                  }))
                }
              />
            </label>
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

          <section className="asset-section" aria-label="Atouts du bien">
            <div className="asset-heading">
              <strong>Atouts de votre bien</strong>
              <span>(selectionnez tout ce qui s&apos;applique)</span>
            </div>

            <div className="asset-grid">
              {quickCriteria.map(([key, label, icon]) => (
                <label
                  className={form[key] ? "asset-pill selected" : "asset-pill"}
                  key={key}
                >
                  <span className={`asset-icon ${icon}`} aria-hidden="true" />
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                </label>
              ))}
              {form.propertyType === "apartment" ? (
                <label
                  className={
                    form.hasElevator ? "asset-pill selected" : "asset-pill"
                  }
                >
                  <span className="asset-icon elevator" aria-hidden="true" />
                  <span>Ascenseur</span>
                  <input
                    type="checkbox"
                    checked={form.hasElevator}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hasElevator: event.target.checked,
                      }))
                    }
                  />
                </label>
              ) : (
                <label
                  className={form.hasPool ? "asset-pill selected" : "asset-pill"}
                >
                  <span className="asset-icon pool" aria-hidden="true" />
                  <span>Piscine</span>
                  <input
                    type="checkbox"
                    checked={form.hasPool}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hasPool: event.target.checked,
                      }))
                    }
                  />
                </label>
              )}
            </div>
          </section>

          <button
            className="primary-action continue-action"
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? "Estimation en cours" : "Estimer"}
            <span aria-hidden="true">-&gt;</span>
          </button>

          {error ? <p className="form-error">{error}</p> : null}

          <p className="privacy-note essential-privacy">
            <span className="privacy-lock" aria-hidden="true" />
            Vos donnees sont protegees et ne seront jamais revendues.
          </p>
        </form>
      </section>
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

    return (
      <section className="result-page" aria-labelledby="result-title">
        <header className="result-topbar">
          <div className="brand-lockup compact" aria-label="ImmoSafe">
            <span className="brand-shield" />
            <strong>
              Immo<span>Safe</span>
            </strong>
          </div>
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

        <div className="result-layout">
          <section className="valuation-card" aria-labelledby="result-title">
            <span className="result-source">
              {estimation.source === "immo-data" ? "Immo Data" : "Mode demonstration"}
            </span>
            <p className="result-address">{estimation.addressLabel}</p>
            <h1 id="result-title">Votre estimation est prete</h1>
            <strong className="result-price">
              {currencyFormatter.format(estimation.medianPrice)}
            </strong>
            <p className="result-range">
              Fourchette estimee : {currencyFormatter.format(estimation.lowPrice)} -{" "}
              {currencyFormatter.format(estimation.highPrice)}
            </p>

            <div className="result-kpis">
              <article>
                <span className="kpi-icon tag" aria-hidden="true" />
                <div>
                  <span>Prix / m2</span>
                  <strong>{numberFormatter.format(estimation.pricePerM2)} EUR/m2</strong>
                </div>
              </article>
              <article>
                <span className="kpi-icon shield" aria-hidden="true" />
                <div>
                  <span>Confiance</span>
                  <strong>{estimation.confidenceScore}/5</strong>
                </div>
              </article>
            </div>

            <p className="result-note">
              Estimation basee sur l&apos;adresse, les caracteristiques du bien et
              les donnees comparables disponibles sur le secteur.
            </p>
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
              <h2 id="comparables-title">Biens comparables vendus</h2>
              <span>Voir tout</span>
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
                  </article>
                ))
              ) : (
                <p className="empty-small">Aucun comparable disponible sur ce secteur.</p>
              )}
            </div>
          </section>

          <aside className="result-side">
            <section className="result-card market-card" aria-labelledby="market-title">
              <h2 id="market-title">Marche local</h2>
              <div className="market-grid">
                <article>
                  <span>Prix moyen</span>
                  <strong>
                    {market?.sectorPricePerM2
                      ? `${numberFormatter.format(market.sectorPricePerM2)} EUR/m2`
                      : "Indisponible"}
                  </strong>
                </article>
                <article>
                  <span>Evolution 12 mois</span>
                  <strong>
                    {market?.priceEvolution12Months !== undefined
                      ? `${market.priceEvolution12Months > 0 ? "+" : ""}${market.priceEvolution12Months} %`
                      : "Indisponible"}
                  </strong>
                </article>
                <article>
                  <span>Offre</span>
                  <strong>{market?.supplyLevel ?? "Indisponible"}</strong>
                </article>
                <article>
                  <span>Delai moyen</span>
                  <strong>
                    {market?.saleDurationDays
                      ? `${market.saleDurationDays} jours`
                      : "Indisponible"}
                  </strong>
                </article>
              </div>
            </section>
          </aside>

          <section className="result-card meaning-card" aria-labelledby="meaning-title">
            <h2 id="meaning-title">Ce que cela signifie pour vous</h2>
            <div className="meaning-grid">
              <article>
                <span>Conseil du prix</span>
                <strong>{priceAdvice}</strong>
              </article>
              <article>
                <span>Potentiel de valorisation</span>
                <strong>
                  {refreshPotential
                    ? `+${currencyFormatter.format(refreshPotential)}`
                    : "A confirmer"}
                </strong>
              </article>
              <article>
                <span>Delai estime</span>
                <strong>
                  {market?.saleDurationDays
                    ? `${market.saleDurationDays} jours`
                    : "A qualifier"}
                </strong>
              </article>
            </div>
          </section>

          <div className="result-actions">
            <button className="primary-action report-action">
              Recevoir le rapport complet
              <span>Analyse detaillee, photos, carte et recommandations</span>
            </button>
            <button className="secondary-action">
              Confier ma vente a ImmoSafe
              <span>Un expert local vous accompagne</span>
            </button>
          </div>

          <p className="privacy-note result-privacy">
            <span className="privacy-lock" aria-hidden="true" />
            Vos donnees sont protegees. Aucune revente de donnees.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="details-step" aria-labelledby="estimation-title">
      <div className="details-header">
        <button
          type="button"
          className="back-button"
          onClick={() => setStep("address")}
        >
          Retour
        </button>
        <div className="brand-lockup compact" aria-label="ImmoSafe">
          <span className="brand-shield" />
          <strong>
            Immo<span>Safe</span>
          </strong>
        </div>
      </div>

      <section className="estimation-module" aria-labelledby="estimation-title">
        <form className="estimation-form" onSubmit={handleSubmit}>
          <div className="module-heading">
            <p className="eyebrow">Etape 2</p>
            <h2 id="estimation-title">Quelques questions pour affiner</h2>
            <p>
              On garde le parcours court. Les criteres avances restent
              optionnels.
            </p>
          </div>

          {addressField}

        <div className="segmented-control" aria-label="Type de bien">
          {(["apartment", "house"] as const).map((type) => (
            <button
              type="button"
              className={form.propertyType === type ? "selected" : ""}
              key={type}
              onClick={() =>
                setForm((current) => ({ ...current, propertyType: type }))
              }
            >
              {type === "apartment" ? "Appartement" : "Maison"}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Surface
            <span className="input-unit">
              <input
                inputMode="decimal"
                name="surface"
                value={form.surfaceM2}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    surfaceM2: event.target.value,
                  }))
                }
              />
              m2
            </span>
          </label>

          <label>
            Pieces
            <input
              inputMode="numeric"
              name="rooms"
              value={form.rooms}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rooms: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <label>
          Etat du bien
          <select
            value={form.condition}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                condition: event.target
                  .value as FormState["condition"],
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

        <section className="quick-criteria" aria-label="Criteres rapides">
          {quickCriteria.map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
          {form.propertyType === "apartment" ? (
            <label>
              <input
                type="checkbox"
                checked={form.hasElevator}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hasElevator: event.target.checked,
                  }))
                }
              />
              Ascenseur
            </label>
          ) : (
            <label>
              <input
                type="checkbox"
                checked={form.hasPool}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hasPool: event.target.checked,
                  }))
                }
              />
              Piscine
            </label>
          )}
        </section>

        <details className="advanced-criteria">
          <summary>
            <span>Affiner l&apos;estimation</span>
            <strong>DPE, etage, annee, salles de bain</strong>
          </summary>

          <div className="advanced-grid">
            <label>
              DPE
              <select
                value={form.dpe}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dpe: event.target.value as FormState["dpe"],
                  }))
                }
              >
                <option value="">Non renseigne</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((dpe) => (
                  <option value={dpe} key={dpe}>
                    {dpe}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Salles de bain
              <input
                inputMode="numeric"
                value={form.bathrooms}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bathrooms: event.target.value,
                  }))
                }
                placeholder="Ex. 1"
              />
            </label>

            <label>
              Annee construction
              <input
                inputMode="numeric"
                value={form.constructionYear}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    constructionYear: event.target.value,
                  }))
                }
                placeholder="Ex. 2010"
              />
            </label>

            {form.propertyType === "apartment" ? (
              <>
                <label>
                  Etage du bien
                  <input
                    inputMode="numeric"
                    value={form.floor}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        floor: event.target.value,
                      }))
                    }
                    placeholder="Ex. 2"
                  />
                </label>
                <label>
                  Etages immeuble
                  <input
                    inputMode="numeric"
                    value={form.buildingLevels}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        buildingLevels: event.target.value,
                      }))
                    }
                    placeholder="Ex. 5"
                  />
                </label>
              </>
            ) : (
              <label>
                Surface terrain
                <span className="input-unit">
                  <input
                    inputMode="decimal"
                    value={form.landAreaM2}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        landAreaM2: event.target.value,
                      }))
                    }
                    placeholder="Ex. 500"
                  />
                  m2
                </span>
              </label>
            )}
          </div>
        </details>

        <button className="primary-action" disabled={!canSubmit || isLoading}>
          {isLoading ? "Estimation en cours" : "Obtenir la fourchette"}
        </button>

        {error ? <p className="form-error">{error}</p> : null}
        </form>

      <aside className="result-panel" aria-live="polite">
        {estimation ? (
          <>
            <div>
              <span className="result-source">
                {estimation.source === "immo-data"
                  ? "Immo Data"
                  : "Mode demonstration"}
              </span>
              <h2>{estimation.addressLabel}</h2>
            </div>

            <div className="price-range">
              <span>Fourchette estimee</span>
              <strong>
                {currencyFormatter.format(estimation.lowPrice)} -{" "}
                {currencyFormatter.format(estimation.highPrice)}
              </strong>
              <em>
                Valeur centrale {currencyFormatter.format(estimation.medianPrice)}
              </em>
            </div>

            <div className="result-metrics">
              <article>
                <span>Prix / m2</span>
                <strong>{numberFormatter.format(estimation.pricePerM2)} EUR</strong>
              </article>
              <article>
                <span>Confiance</span>
                <strong>{estimation.confidenceScore}/5</strong>
              </article>
            </div>

            <ul className="signal-list">
              {estimation.marketSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="empty-result">
            <span>En attente</span>
            <h2>La fourchette s&apos;affichera ici.</h2>
            <p>
              Premier test : adresse, type de bien, surface et pieces. Ensuite
              on enrichira avec DPE, etage, terrain et comparables.
            </p>
          </div>
        )}
      </aside>
    </section>
    </section>
  );
}

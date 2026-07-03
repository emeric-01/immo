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
  condition: NonNullable<PropertyEstimationInput["condition"]>;
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

const initialForm: FormState = {
  address: "",
  propertyType: "apartment",
  surfaceM2: "72",
  rooms: "3",
  condition: "good",
  dpe: "",
  bathrooms: "",
  constructionYear: "",
  buildingLevels: "",
  floor: "",
  landAreaM2: "",
  hasOutdoorSpace: false,
  hasParking: false,
  hasElevator: true,
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
  ["hasOutdoorSpace", "Exterieur"],
  ["hasParking", "Parking"],
  ["hasCellar", "Cave"],
  ["hasNiceView", "Belle vue"],
] as const;

function optionalNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function EstimationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedAddress, setSelectedAddress] =
    useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
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
      condition: form.condition,
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

  return (
    <section className="estimation-module" aria-labelledby="estimation-title">
      <form className="estimation-form" onSubmit={handleSubmit}>
        <div className="module-heading">
          <p className="eyebrow">Module MVP</p>
          <h2 id="estimation-title">Estimer une fourchette par adresse</h2>
          <p>
            Le module appelle notre route interne. Sans cle Immo Data, il reste
            en mode demonstration.
          </p>
        </div>

        <label>
          Adresse du bien
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
              placeholder="Ex. 26 Rue de Beaulieu, 49400 Saumur"
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
          ) : (
            <span className="field-hint">
              Immo Data geocode les adresses puis renvoie les coordonnees pour
              l&apos;estimation. Recherche a partir de 10 caracteres.
            </span>
          )}
        </label>

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
                  .value as NonNullable<PropertyEstimationInput["condition"]>,
              }))
            }
          >
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
  );
}

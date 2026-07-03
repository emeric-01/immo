"use client";

import { FormEvent, useMemo, useState } from "react";
import type {
  PropertyEstimation,
  PropertyEstimationInput,
  RealtyType,
} from "@/lib/immo-data";

type FormState = {
  address: string;
  propertyType: RealtyType;
  surfaceM2: string;
  rooms: string;
  condition: NonNullable<PropertyEstimationInput["condition"]>;
  hasOutdoorSpace: boolean;
  hasParking: boolean;
  hasElevator: boolean;
};

const initialForm: FormState = {
  address: "26 Rue de Beaulieu, 49400 Saumur",
  propertyType: "apartment",
  surfaceM2: "72",
  rooms: "3",
  condition: "good",
  hasOutdoorSpace: false,
  hasParking: false,
  hasElevator: true,
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function EstimationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [estimation, setEstimation] = useState<PropertyEstimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.address.trim().length > 4 &&
      Number(form.surfaceM2) > 0 &&
      Number(form.rooms) > 0
    );
  }, [form.address, form.rooms, form.surfaceM2]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEstimation(null);
    setIsLoading(true);

    const payload: PropertyEstimationInput = {
      address: form.address.trim(),
      propertyType: form.propertyType,
      surfaceM2: Number(form.surfaceM2),
      rooms: Number(form.rooms),
      condition: form.condition,
      hasOutdoorSpace: form.hasOutdoorSpace,
      hasParking: form.hasParking,
      hasElevator:
        form.propertyType === "apartment" ? form.hasElevator : undefined,
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
          <input
            name="address"
            autoComplete="street-address"
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                address: event.target.value,
              }))
            }
            placeholder="Ex. 26 Rue de Beaulieu, 49400 Saumur"
          />
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

        <div className="toggle-grid" aria-label="Caracteristiques">
          <label>
            <input
              type="checkbox"
              checked={form.hasOutdoorSpace}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hasOutdoorSpace: event.target.checked,
                }))
              }
            />
            Terrasse / exterieur
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.hasParking}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hasParking: event.target.checked,
                }))
              }
            />
            Parking
          </label>
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
          ) : null}
        </div>

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

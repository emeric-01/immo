"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  Handshake,
  Home,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PhoneCall,
  Ruler,
  Sparkles,
  Tag,
} from "lucide-react";
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
type LeadSubmitState = "idle" | "loading" | "success" | "error";
type LeadIntent = "detailed_study" | "human_estimate";

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
const agencyPhoneHref = "tel:+33619821984";
const agencyPhoneLabel = "06 19 82 19 84";
const roomOptions = ["1", "2", "3", "4", "5", "6"] as const;
const priorityEstimationCities = [
  { name: "Aubagne", slug: "aubagne" },
  { name: "Ollioules", slug: "ollioules" },
  { name: "Marseille", slug: "marseille" },
  { name: "Le Castellet", slug: "le-castellet" },
  { name: "Toulon", slug: "toulon" },
  { name: "Aix-en-Provence", slug: "aix-en-provence" },
  { name: "Ceyreste", slug: "ceyreste" },
  { name: "Bandol", slug: "bandol" },
] as const;

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
  const [leadState, setLeadState] = useState<LeadSubmitState>("idle");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadIntent, setLeadIntent] = useState<LeadIntent>("detailed_study");
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

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadState("loading");
    setLeadMessage("");

    const leadForm = event.currentTarget;
    const formData = new FormData(leadForm);

    try {
      const response = await fetch("/api/seller-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address.trim(),
          city: selectedAddress?.cityName ?? "Secteur du bien",
          propertyType: form.propertyType,
          requestType: leadIntent,
          phone: formData.get("phone"),
          consent: formData.get("consent"),
          website: formData.get("website"),
          estimationId: estimation?.clientEstimationId,
          estimatedLowPrice: estimation?.lowPrice,
          estimatedHighPrice: estimation?.highPrice,
          estimatedMedianPrice: estimation?.medianPrice,
          estimatedPricePerM2: estimation?.pricePerM2,
          confidenceScore: estimation?.confidenceScore,
          surfaceM2: Number(form.surfaceM2),
          rooms: Number(form.rooms),
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Votre demande n’a pas pu être envoyée.");
      }

      leadForm.reset();
      setLeadState("success");
      setLeadMessage(
        leadIntent === "human_estimate"
          ? "Merci. Nous vous rappelons rapidement pour organiser l’estimation de votre bien sur place."
          : "Merci. Nous vous rappelons rapidement pour préparer l’étude détaillée de votre bien.",
      );
    } catch (leadError) {
      setLeadState("error");
      setLeadMessage(
        leadError instanceof Error
          ? leadError.message
          : "Votre demande n’a pas pu être envoyée.",
      );
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

          <nav className="estimation-city-links" aria-label="Estimations immobilières par ville">
            <p>Estimations immobilières locales</p>
            <div>
              {priorityEstimationCities.map((city) => (
                <Link href={`/estimation-immobiliere/${city.slug}`} key={city.slug}>
                  {city.name}
                </Link>
              ))}
            </div>
            <Link className="estimation-city-index" href="/estimation-immobiliere">
              Voir toutes les villes <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </nav>
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
          <section className="valuation-card result-valuation-hero" aria-labelledby="result-title">
            <div className="valuation-main">
              <span className="result-source">Données de marché et ventes comparables</span>
              <p className="result-address">{estimation.addressLabel}</p>
              <p className="valuation-kicker">Votre première fourchette</p>
              <h1 id="result-title">Une estimation de marché, à affiner avec votre bien</h1>
              <div className="result-price-range" aria-label={`Entre ${currencyFormatter.format(estimation.lowPrice)} et ${currencyFormatter.format(estimation.highPrice)}`}>
                <strong>{currencyFormatter.format(estimation.lowPrice)}</strong>
                <span>à</span>
                <strong>{currencyFormatter.format(estimation.highPrice)}</strong>
              </div>
              <p className="result-range result-range-explanation">
                Cette fourchette volontairement prudente donne un repère à partir des
                transactions locales et des informations renseignées. Elle ne remplace pas
                l&apos;analyse du bien, de son environnement et de son potentiel réel.
              </p>
              <div className="valuation-scale" aria-label="Position du point central statistique dans la fourchette">
                <div className="valuation-track">
                  <span className="valuation-fill" style={{ width: `${medianPosition}%` }} />
                  <span className="valuation-marker" style={{ left: `${medianPosition}%` }} />
                </div>
                <div><span>Fourchette basse</span><strong>Repère statistique {currencyFormatter.format(estimation.medianPrice)}</strong><span>Fourchette haute</span></div>
              </div>
            </div>
            <aside className="valuation-expert-panel">
              <span className="expert-panel-kicker"><CheckCircle2 aria-hidden="true" /> Fourchette obtenue · prochaine étape</span>
              <h2>Transformons ce repère en avis de valeur.</h2>
              <p>
                Nous reprenons les données, sélectionnons les comparables réellement pertinents
                et intégrons ce qu&apos;un algorithme ne peut pas voir dans votre bien.
              </p>
              <ul className="expert-benefit-list">
                <li><Check aria-hidden="true" /> Lecture du micro-secteur et des ventes comparables</li>
                <li><Check aria-hidden="true" /> Analyse de l&apos;état, de la vue et des prestations</li>
                <li><Check aria-hidden="true" /> Premier conseil de positionnement pour vendre</li>
              </ul>
              <div className="expert-primary-actions">
                <a
                  className="expert-main-action"
                  href="#confier-mon-bien"
                  onClick={() => setLeadIntent("detailed_study")}
                >
                  <FileSearch aria-hidden="true" />
                  <span>
                    <strong>Demander mon étude approfondie</strong>
                    <small>Gratuite et sans engagement</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </a>
                <a
                  className="expert-call-action"
                  href={agencyPhoneHref}
                >
                  <PhoneCall aria-hidden="true" />
                  <span>
                    <small>Vous préférez échanger maintenant&nbsp;?</small>
                    <strong>Appeler l&apos;agence · {agencyPhoneLabel}</strong>
                  </span>
                </a>
              </div>
              <small className="expert-panel-reassurance">Un premier échange suffit pour comprendre votre projet et vous orienter.</small>
            </aside>
          </section>

          <section className="result-reading-grid summary-card" aria-labelledby="summary-title">
            <article className="result-card data-reading-card">
              <span className="section-index">01 — CE QUE LES DONNÉES NOUS DISENT</span>
              <h2 id="summary-title">Les repères disponibles aujourd&apos;hui</h2>
              <div className="summary-chips">
                {resultChips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              <div className="data-reading-metrics">
                <div><Ruler aria-hidden="true" /><span><strong>{numberFormatter.format(estimation.pricePerM2)} €/m²</strong>Prix estimé du bien</span></div>
                <div><Home aria-hidden="true" /><span><strong>{estimation.comparables.length}</strong>Ventes comparables</span></div>
                <div><BarChart3 aria-hidden="true" /><span><strong>{market?.priceEvolution12Months !== undefined ? `${market.priceEvolution12Months > 0 ? "+" : ""}${market.priceEvolution12Months} %` : "NC"}</strong>Évolution sur 12 mois</span></div>
                <div><FileSearch aria-hidden="true" /><span><strong>{estimation.confidenceScore}/5</strong>Fiabilité des données</span></div>
              </div>
            </article>

            <article className="result-card visit-reading-card">
              <span className="section-index">02 — CE QUE LA VISITE DOIT RÉVÉLER</span>
              <h2>Les critères qui font vraiment varier la valeur</h2>
              <div className="visit-factor-list">
                <span><MapPin aria-hidden="true" /><strong>Adresse et micro-emplacement</strong></span>
                <span><Eye aria-hidden="true" /><strong>Vue, lumière et nuisances</strong></span>
                <span><Sparkles aria-hidden="true" /><strong>État, volumes et présentation</strong></span>
                <span><Ruler aria-hidden="true" /><strong>Potentiel d&apos;aménagement ou de division</strong></span>
              </div>
              <p>Ce sont ces éléments, invisibles dans une base de données, qui permettent de défendre un prix auprès des acquéreurs.</p>
            </article>
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
            <div className="seller-takeaway"><span>Notre lecture</span><strong>{priceAdvice}</strong><p>{market?.saleDurationDays ? `Le marché local absorbe actuellement les biens en environ ${market.saleDurationDays} jours.` : "Le délai sera précisé après l'analyse terrain de notre équipe."} {refreshPotential ? `Un potentiel de valorisation d'environ ${currencyFormatter.format(refreshPotential)} reste à confirmer sur place.` : "La présentation et le lancement seront déterminants pour défendre ce prix."}</p></div>
          </section>

          <section className="result-card result-case-section" aria-labelledby="case-title">
            <div className="section-heading case-section-heading">
              <span className="section-index">04 — AU-DELÀ DE LA MOYENNE</span>
              <h2 id="case-title">Trois situations où la visite change l&apos;analyse</h2>
              <p>Pas de promesse artificielle : nous cherchons les éléments concrets qui permettent de mieux positionner et mieux présenter le bien.</p>
            </div>
            <div className="result-case-grid">
              <article>
                <span>Potentiel du bien</span>
                <h3>{form.propertyType === "house" ? "Terrain, extension ou division" : "Plan, étage et copropriété"}</h3>
                <p>{form.propertyType === "house" ? "Le PLU, les accès et la configuration parcellaire peuvent révéler un potentiel que le prix au m² ne voit pas." : "Une distribution optimisable, une belle exposition ou les caractéristiques de la copropriété changent la perception du bien."}</p>
              </article>
              <article>
                <span>Présentation</span>
                <h3>Faire percevoir les bons volumes</h3>
                <p>Circulation, lumière, usages et quelques ajustements ciblés peuvent aider les acquéreurs à se projeter sans engager de travaux inutiles.</p>
              </article>
              <article>
                <span>Commercialisation</span>
                <h3>Le bon prix, au bon moment</h3>
                <p>Le prix le plus haut n&apos;est pas toujours celui qui rapporte le plus. Un lancement cohérent protège l&apos;attractivité et le pouvoir de négociation.</p>
              </article>
            </div>
            <Link className="case-proof-link" href="/biens">
              Découvrir les biens présentés par l&apos;agence <ArrowRight aria-hidden="true" />
            </Link>
          </section>

          <section className="result-card result-content-section" aria-labelledby="content-title">
            <div className="section-heading inline">
              <div><span className="section-index">POUR PRÉPARER VOTRE DÉCISION</span><h2 id="content-title">Nos conseils avant de vendre</h2></div>
              <Link href="/contenus">Tous les contenus <ArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="result-content-links">
              <Link href="/contenus/estimation-immobiliere-fiable-data-humain">
                <span>Estimation</span><strong>Pourquoi les algorithmes ne suffisent pas</strong><ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/contenus/division-parcellaire-immobilier-valoriser-terrain">
                <span>Urbanisme</span><strong>Quand le potentiel du terrain change la valeur</strong><ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/contenus/vendre-avant-apres-travaux">
                <span>Valorisation</span><strong>Vendre avant ou après travaux&nbsp;?</strong><ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="mandate-conversion" id="etude-approfondie" aria-labelledby="mandate-title">
            <div className="mandate-conversion-copy">
              <span className="section-index">VOTRE ANALYSE APPROFONDIE</span>
              <h2 id="mandate-title">Votre estimation mérite maintenant un regard professionnel.</h2>
              <p>
                Nous partons de cette fourchette pour produire un avis plus précis, comprendre
                les qualités propres au bien et préparer, si vous souhaitez vendre, une stratégie
                cohérente avec votre marché local.
              </p>
              <div className="mandate-benefits">
                <span><FileSearch aria-hidden="true" /><strong>Comparables sélectionnés</strong>Les références vraiment pertinentes autour du bien</span>
                <span><MapPin aria-hidden="true" /><strong>Micro-emplacement analysé</strong>Adresse, environnement, vue et nuisances</span>
                <span><Ruler aria-hidden="true" /><strong>Potentiel vérifié</strong>Urbanisme, volumes, travaux et usages possibles</span>
                <span><Handshake aria-hidden="true" /><strong>Conseil de mise en vente</strong>Prix de lancement, présentation et stratégie</span>
              </div>
              <p className="mandate-signature">La donnée donne un repère. Le regard métier permet de défendre la valeur.</p>
            </div>

            <aside className="mandate-lead-card" id="confier-mon-bien">
              <div className="mandate-intent-switch" role="group" aria-label="Choisir le type d’accompagnement">
                <button
                  aria-pressed={leadIntent === "detailed_study"}
                  className={leadIntent === "detailed_study" ? "selected" : ""}
                  onClick={() => setLeadIntent("detailed_study")}
                  type="button"
                >
                  <FileSearch aria-hidden="true" />
                  <span><strong>Étude approfondie</strong><small>Analyse et comparables</small></span>
                </button>
                <button
                  aria-pressed={leadIntent === "human_estimate"}
                  className={leadIntent === "human_estimate" ? "selected" : ""}
                  onClick={() => setLeadIntent("human_estimate")}
                  type="button"
                >
                  <Home aria-hidden="true" />
                  <span><strong>Visite du bien</strong><small>Estimation sur place</small></span>
                </button>
              </div>
              <span className="section-index">
                {leadIntent === "human_estimate" ? "ESTIMATION HUMAINE" : "ÉTUDE DÉTAILLÉE"}
              </span>
              <h3>
                {leadIntent === "human_estimate"
                  ? "Organisons une estimation sur place"
                  : "Recevez une étude plus approfondie"}
              </h3>
              <p>
                {leadIntent === "human_estimate"
                  ? "Un membre de notre équipe vous rappelle pour comprendre votre projet et convenir d’une visite du bien."
                  : "Nous vous rappelons pour compléter les informations, sélectionner les références pertinentes et préparer une première analyse argumentée."}
              </p>
              {leadState === "success" ? (
                <div className="mandate-success" role="status">
                  <CheckCircle2 aria-hidden="true" />
                  <strong>Votre demande est bien partie.</strong>
                  <p>{leadMessage}</p>
                </div>
              ) : (
                <form className="mandate-lead-form" onSubmit={handleLeadSubmit}>
                  <label>
                    <span>Bien concerné</span>
                    <input readOnly value={`${propertyLabel} · ${estimation.addressLabel}`} />
                  </label>
                  <label>
                    <span>Votre téléphone</span>
                    <input autoComplete="tel" inputMode="tel" name="phone" placeholder="06 12 34 56 78" required type="tel" />
                  </label>
                  <label className="mandate-honeypot" aria-hidden="true">
                    <span>Ne pas remplir</span>
                    <input autoComplete="off" name="website" tabIndex={-1} />
                  </label>
                  <label className="mandate-consent">
                    <input name="consent" required type="checkbox" value="accepted" />
                    <span>J&apos;accepte d&apos;être recontacté au sujet de mon projet immobilier.</span>
                  </label>
                  <button disabled={leadState === "loading"} type="submit">
                    {leadState === "loading" ? <LoaderCircle className="mandate-spinner" aria-hidden="true" /> : null}
                    {leadIntent === "human_estimate"
                      ? "Demander mon estimation humaine"
                      : "Recevoir mon étude détaillée"}
                    {leadState !== "loading" ? <ArrowRight aria-hidden="true" /> : null}
                  </button>
                  {leadState === "error" ? <p className="mandate-error" role="alert">{leadMessage}</p> : null}
                </form>
              )}
              <small><LockKeyhole aria-hidden="true" /> Échange gratuit, confidentiel et sans engagement.</small>
              <a className="mandate-direct-call" href={agencyPhoneHref}>
                <PhoneCall aria-hidden="true" />
                <span>Besoin d&apos;une réponse immédiate&nbsp;?</span>
                <strong>{agencyPhoneLabel}</strong>
              </a>
              <Link href="/honoraires">Consulter nos honoraires</Link>
            </aside>
          </section>

          <p className="privacy-note result-privacy">
            <span className="privacy-lock" aria-hidden="true" />
            Vos données sont protégées. Aucune revente de données.
          </p>
        </div>
        <nav className="result-mobile-conversion" aria-label="Affiner ou discuter de cette estimation">
          <a href="#confier-mon-bien" onClick={() => setLeadIntent("detailed_study")}>
            Affiner mon estimation
          </a>
          <a aria-label={`Appeler l'agence au ${agencyPhoneLabel}`} href={agencyPhoneHref}>
            <PhoneCall aria-hidden="true" />
          </a>
        </nav>
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

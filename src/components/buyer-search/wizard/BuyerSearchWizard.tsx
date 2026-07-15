"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  CircleUserRound,
  Euro,
  Heart,
  Home,
  Info,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  Minus,
  Pencil,
  Phone,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  WalletCards,
} from "lucide-react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import type { ZodIssue } from "zod";
import {
  allPreferenceOptions,
  citySuggestions,
  financingOptions,
  getPreferenceOptions,
  normalizePropertyTypes,
  optionLabel,
  preferredChannelOptions,
  propertyTypeLabels,
  purchaseTimelineOptions,
  radiusOptions,
  situationOptions,
} from "@/lib/buyer-search/options";
import { stepSchemas } from "@/lib/buyer-search/schema";
import { loadBuyerSearchDraft, saveBuyerSearchDraft } from "@/lib/buyer-search/storage";
import { submitBuyerSearch } from "@/lib/buyer-search/submit";
import {
  buyerSearchSteps,
  defaultBuyerSearchData,
  type BuyerSearchCity,
  type BuyerSearchFormData,
  type PriorityLevel,
  type WizardStepId,
} from "@/lib/buyer-search/types";
import styles from "./buyer-search-wizard.module.css";

const stepCopy: Record<WizardStepId, { title: string; subtitle?: string }> = {
  location: {
    title: "Ou recherchez-vous votre futur bien ?",
    subtitle: "Indiquez une ou plusieurs villes ou secteurs. Vous pourrez ajuster la zone plus tard.",
  },
  property: {
    title: "Quel bien recherchez-vous ?",
    subtitle: "Precisez le type de bien, votre budget et les criteres essentiels.",
  },
  characteristics: {
    title: "De combien d'espace avez-vous besoin ?",
    subtitle: "Precisez les elements essentiels de votre futur bien. Vous pourrez completer vos preferences ensuite.",
  },
  preferences: {
    title: "Quelles sont vos preferences et equipements souhaites ?",
    subtitle: "Selectionnez les criteres qui comptent pour vous. Vous pourrez les classer plus tard.",
  },
  project: {
    title: "Ou en etes-vous dans votre projet ?",
    subtitle: "Ces informations nous permettent de vous accompagner au mieux et de vous proposer les biens les plus pertinents.",
  },
  summary: {
    title: "Votre recherche en resume",
    subtitle: "Verifiez les informations renseignees avant de definir vos priorites.",
  },
  priorities: {
    title: "Qu'est-ce qui est indispensable ou souhaite pour vous ?",
    subtitle: "Indispensable : critere non negociable. Souhaite : je peux faire une concession.",
  },
  contact: {
    title: "Derniere etape !",
    subtitle: "Nous avons presque termine. Renseignez vos coordonnees pour enregistrer votre recherche.",
  },
};

const DEFAULT_CITY_RADIUS_KM = 2;
const DEFAULT_MINIMUM_LAND_AREA = 500;
const CHARACTERISTIC_COUNTERS_RESET_KEY = "les-jumelles:buyer-search:counters-reset-v1";
const PREFERENCES_RESET_KEY = "les-jumelles:buyer-search:preferences-reset-v1";
const EQUIPMENT_ICONS = {
  parking: "/buyer-search-icons/car-parking.svg",
  outdoor: "/buyer-search-icons/park.svg",
  buildingComfort: "/buyer-search-icons/building.svg",
  houseEquipment: "/buyer-search-icons/home.svg",
  additionalSpaces: "/buyer-search-icons/parked-car.svg",
  works: "/buyer-search-icons/home-repair.svg",
  environment: "/buyer-search-icons/park.svg",
} as const;

type StepProps = {
  form: ReturnType<typeof useForm<BuyerSearchFormData>>;
  goToStep: (step: WizardStepId) => void;
};

export function BuyerSearchWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const firstErrorRef = useRef<HTMLParagraphElement | null>(null);
  const form = useForm<BuyerSearchFormData>({
    defaultValues: defaultBuyerSearchData,
    mode: "onTouched",
  });
  const { clearErrors, formState, getValues, handleSubmit, reset, setError, setValue, watch } =
    form;
  const activeStep = buyerSearchSteps[stepIndex];
  const data = watch();

  useEffect(() => {
    clearErrors();
  }, [activeStep.id, clearErrors]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("source") === "client") {
      void loadClientProjectIntoForm(params.get("searchId"));
      return;
    }

    const draft = loadBuyerSearchDraft();

    if (draft) {
      const shouldResetCounters =
        typeof window !== "undefined" && window.localStorage.getItem(CHARACTERISTIC_COUNTERS_RESET_KEY) !== "done";
      const shouldResetPreferences =
        typeof window !== "undefined" && window.localStorage.getItem(PREFERENCES_RESET_KEY) !== "done";
      let nextDraft = { ...defaultBuyerSearchData, ...draft };

      if (shouldResetCounters) {
        nextDraft = resetCharacteristicCounters(nextDraft);
      }

      if (shouldResetPreferences) {
        nextDraft = resetPreferenceSelections(nextDraft);
      }

      reset(nextDraft);

      if (shouldResetCounters) {
        window.localStorage.setItem(CHARACTERISTIC_COUNTERS_RESET_KEY, "done");
      }

      if (shouldResetPreferences) {
        window.localStorage.setItem(PREFERENCES_RESET_KEY, "done");
      }
    }

    setDraftReady(true);

    async function loadClientProjectIntoForm(searchId: string | null) {
      try {
        const endpoint = searchId
          ? `/api/client/project?id=${encodeURIComponent(searchId)}`
          : "/api/client/project";
        const response = await fetch(endpoint, { cache: "no-store" });

        if (!response.ok) {
          setDraftReady(true);
          return;
        }

        const payload = (await response.json()) as {
          profile?: { email: string; firstName: string; lastName: string };
          search?: BuyerSearchFormData;
        };

        if (payload.search) {
          reset({ ...defaultBuyerSearchData, ...payload.search });
          setClientEmail(payload.search.contact.email);
        } else if (payload.profile) {
          reset({
            ...defaultBuyerSearchData,
            contact: {
              ...defaultBuyerSearchData.contact,
              email: payload.profile.email,
              firstName: payload.profile.firstName,
              lastName: payload.profile.lastName,
            },
          });
          setClientEmail(payload.profile.email);
        }
      } finally {
        setDraftReady(true);
      }
    }
  }, [reset]);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    const subscription = watch((value) => {
      saveBuyerSearchDraft(value as BuyerSearchFormData);
    });

    return () => subscription.unsubscribe();
  }, [draftReady, watch]);

  useEffect(() => {
    if (activeStep.id !== "priorities") {
      return;
    }

    const priorities = buildPriorityItems(getValues());
    setValue("priorities", priorities, { shouldDirty: true });
  }, [activeStep.id, getValues, setValue]);

  function setZodErrors(scope: string, issues: ZodIssue[]) {
    clearErrors();
    issues.forEach((issue) => {
      const path = issue.path.length > 0 ? `${scope}.${issue.path.join(".")}` : scope;
      setError(path as never, { type: "manual", message: issue.message });
    });
    window.setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
  }

  function validateStep(id: WizardStepId) {
    if (id === "summary") {
      return true;
    }

    const current = getValues();
    const payload = current[id];
    const result = stepSchemas[id].safeParse(payload);

    if (!result.success) {
      setZodErrors(id, result.error.issues);
      return false;
    }

    if (id === "property") {
      const characteristicsResult = stepSchemas.characteristics.safeParse(current.characteristics);

      if (!characteristicsResult.success) {
        setZodErrors("characteristics", characteristicsResult.error.issues);
        return false;
      }
    }

    clearErrors();
    return true;
  }

  function goToStep(step: WizardStepId) {
    const nextIndex = buyerSearchSteps.findIndex((candidate) => candidate.id === step);

    if (nextIndex >= 0) {
      clearErrors();
      setStepIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function nextStep() {
    if (!validateStep(activeStep.id)) {
      return;
    }

    if (stepIndex < buyerSearchSteps.length - 1) {
      setStepIndex((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function previousStep() {
    clearErrors();
    setStepIndex((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onFinalSubmit(values: BuyerSearchFormData) {
    if (!validateStep("contact")) {
      return;
    }

    const finalData = {
      ...values,
      priorities: values.priorities.length > 0 ? values.priorities : buildPriorityItems(values),
    };

    try {
      await submitBuyerSearch(finalData);
      router.push("/recherche/confirmation");
    } catch {
      setError("contact.consent" as never, {
        type: "manual",
        message: "La recherche n'a pas pu etre enregistree. Reessayez dans quelques instants.",
      });
      window.setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
    }
  }

  const stepComponent = (
    {
      location: <StepLocation form={form} goToStep={goToStep} />,
      property: <StepProperty form={form} goToStep={goToStep} />,
      characteristics: <StepCharacteristics form={form} goToStep={goToStep} />,
      preferences: <StepPreferences form={form} goToStep={goToStep} />,
      project: <StepProject form={form} goToStep={goToStep} />,
      summary: <StepSummary form={form} goToStep={goToStep} />,
      priorities: <StepPriorities form={form} goToStep={goToStep} />,
      contact: <StepContact clientEmail={clientEmail} form={form} goToStep={goToStep} />,
    } satisfies Record<WizardStepId, React.ReactNode>
  )[activeStep.id];

  return (
    <main className={styles.page}>
      <form className={styles.shell} onSubmit={(event) => event.preventDefault()}>
        <ProgressStepper activeIndex={stepIndex} />
        <header className={styles.stepHeader}>
          <div>
            <h1>{activeStep.id === "contact" ? "Derniere etape !" : stepCopy[activeStep.id].title}</h1>
            {activeStep.id === "contact" ? <h2>Vos coordonnees</h2> : null}
            {stepCopy[activeStep.id].subtitle ? <p>{stepCopy[activeStep.id].subtitle}</p> : null}
          </div>
          {["preferences", "project", "summary", "priorities", "contact"].includes(activeStep.id) ? (
            <InfoCallout
              icon={activeStep.id === "contact" ? ShieldCheck : Lightbulb}
              text={
                activeStep.id === "contact"
                  ? "Vos donnees sont securisees et ne seront jamais partagees."
                  : activeStep.id === "summary"
                    ? 'Vous pourrez modifier chaque element en cliquant sur "Modifier".'
                    : activeStep.id === "priorities"
                      ? "Basculez chaque critere en Souhaite ou Indispensable selon votre priorite."
                      : "Vos reponses restent confidentielles et ne vous engagent a rien."
              }
            />
          ) : null}
        </header>
        {formState.errors ? (
          <FirstError
            errors={formState.errors}
            scope={activeStep.id}
            refCallback={(node) => (firstErrorRef.current = node)}
          />
        ) : null}
        {stepComponent}
        <WizardNavigation
          isFirst={stepIndex === 0}
          isLast={stepIndex === buyerSearchSteps.length - 1}
          onBack={previousStep}
          onNext={nextStep}
          onSubmit={handleSubmit(onFinalSubmit)}
          nextLabel={
            activeStep.id === "summary"
              ? "Definir mes priorites"
              : activeStep.id === "contact"
                ? "Enregistrer ma recherche"
                : "Continuer"
          }
        />
        <p className={styles.securityNote}>
          <Lock size={16} aria-hidden="true" />
          Vos informations restent confidentielles et ne sont jamais partagees.
        </p>
      </form>
      <LiveDraftDebugger data={data} />
    </main>
  );
}

function ProgressStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className={styles.progress} aria-label="Progression du formulaire">
      {buyerSearchSteps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <li className={styles.progressItem} data-state={isDone ? "done" : isActive ? "active" : "todo"} key={step.id}>
            <span className={styles.progressDot} aria-hidden="true">
              {isDone ? <Check size={14} /> : index + 1}
            </span>
            <span>{index + 1}. {step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function WizardNavigation({
  isFirst,
  isLast,
  nextLabel,
  onBack,
  onNext,
  onSubmit,
}: {
  isFirst: boolean;
  isLast: boolean;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void | Promise<void>;
}) {
  return (
    <div className={styles.navigation}>
      <button className={styles.backButton} disabled={isFirst} type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        Retour
      </button>
      <button className={styles.primaryButton} type="button" onClick={isLast ? onSubmit : onNext}>
        {isLast ? <Lock size={18} aria-hidden="true" /> : null}
        {nextLabel}
        {!isLast ? <ArrowRight size={18} aria-hidden="true" /> : null}
      </button>
    </div>
  );
}

function StepLocation({ form }: StepProps) {
  const { setValue, watch } = form;
  const location = watch("location");
  const selectedCities = useMemo(
    () => normalizeSelectedCities(location.cities, location.radiusKm ?? DEFAULT_CITY_RADIUS_KM),
    [location.cities, location.radiusKm],
  );
  const [query, setQuery] = useState("");
  const [cityResults, setCityResults] = useState<BuyerSearchCity[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const filteredCities = cityResults.filter(
    (city) => !selectedCities.some((selectedCity) => areSameCity(selectedCity, city)),
  );

  useEffect(() => {
    if (!areCityListsEqual(selectedCities, location.cities)) {
      setValue("location.cities", selectedCities, { shouldDirty: true, shouldValidate: true });
    }
  }, [location.cities, selectedCities, setValue]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setCityResults([]);
      setIsSearchingCities(false);
      return;
    }

    const controller = new AbortController();
    const debounce = window.setTimeout(async () => {
      setIsSearchingCities(true);

      try {
        const response = await fetch(`/api/communes?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("La recherche de communes est indisponible.");
        }

        const results = (await response.json()) as BuyerSearchCity[];
        setCityResults(results);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        const localResults = citySuggestions.filter((city) =>
          `${city.name} ${city.postalCode ?? ""}`.toLowerCase().includes(normalizedQuery.toLowerCase()),
        );
        setCityResults(localResults);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingCities(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(debounce);
    };
  }, [query]);

  function addCity(city: BuyerSearchCity) {
    if (selectedCities.some((candidate) => areSameCity(candidate, city))) {
      return;
    }
    setValue("location.cities", [...selectedCities, withCityRadius(city, location.radiusKm ?? DEFAULT_CITY_RADIUS_KM)], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setQuery("");
    setCityResults([]);
  }

  function removeCity(cityToRemove: BuyerSearchCity) {
    setValue(
      "location.cities",
      selectedCities.filter((city) => !areSameCity(city, cityToRemove)),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function updateCityRadius(cityToUpdate: BuyerSearchCity, radiusKm: number) {
    setValue(
      "location.cities",
      selectedCities.map((city) => (areSameCity(city, cityToUpdate) ? { ...city, radiusKm } : city)),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  return (
    <section className={styles.twoColumn}>
      <div className={styles.formColumn}>
        <label className={styles.field}>
          Rechercher une ville ou un code postal
          <span className={styles.searchInput}>
            <MapPin size={18} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une ville ou un code postal..."
            />
          </span>
          <span className={styles.fieldNote}>Ajoutez plusieurs villes si vous le souhaitez.</span>
        </label>
        {query.trim().length >= 2 ? (
          <div className={styles.suggestions} role="listbox">
            {filteredCities.map((city) => (
              <button type="button" key={getCityKey(city)} onClick={() => addCity(city)}>
                {city.name} <span>{formatCityPostalCodes(city)}</span>
              </button>
            ))}
            {filteredCities.length === 0 ? (
              <p>{isSearchingCities ? "Recherche en cours..." : "Aucune commune trouvee pour cette recherche."}</p>
            ) : null}
          </div>
        ) : null}
        <FormError errors={form.formState.errors} path="location.cities" />
        <div className={styles.optionBlock}>
          <h3>Villes ou secteurs selectionnes</h3>
          <div className={styles.selectedCityList}>
            {selectedCities.map((city) => (
              <article className={styles.cityRadiusCard} key={getCityKey(city)}>
                <div className={styles.cityRadiusHeader}>
                  <span>{city.name}</span>
                  <button type="button" onClick={() => removeCity(city)} aria-label={`Supprimer ${city.name}`}>
                    x
                  </button>
                </div>
                <div className={styles.cityRadiusOptions} aria-label={`Rayon autour de ${city.name}`}>
                  {radiusOptions.map((radius) => (
                    <button
                      type="button"
                      key={radius}
                      data-selected={(city.radiusKm ?? DEFAULT_CITY_RADIUS_KM) === radius || undefined}
                      onClick={() => updateCityRadius(city, radius)}
                    >
                      {radius} km
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <LocationMap cities={selectedCities} />
    </section>
  );
}

function StepProperty({ form }: StepProps) {
  const { setValue, watch, register } = form;
  const property = watch("property");
  const characteristics = watch("characteristics");
  const selectedPropertyTypes = normalizePropertyTypes(property.types?.length ? property.types : property.type);

  function updateCounter(path: keyof BuyerSearchFormData["characteristics"], delta: number, min: number) {
    const value = characteristics[path] ?? min;
    setValue(`characteristics.${path}`, Math.max(min, value + delta), { shouldDirty: true, shouldValidate: true });
  }

  return (
    <section className={styles.twoColumn}>
      <div className={`${styles.formColumn} ${styles.compactSearchForm}`}>
        <div className={styles.compactSection}>
          <h3>Type de bien recherche</h3>
          <div className={styles.compactPropertyCards}>
            {(["house", "apartment"] as const).map((type) => (
              <button
                className={styles.compactChoiceCard}
                data-selected={selectedPropertyTypes.includes(type) || undefined}
                type="button"
                key={type}
                onClick={() => {
                  const nextTypes = selectedPropertyTypes.includes(type)
                    ? selectedPropertyTypes.filter((selectedType) => selectedType !== type)
                    : [...selectedPropertyTypes, type];

                  setValue("property.types", nextTypes, { shouldDirty: true, shouldValidate: true });
                  setValue("property.type", nextTypes.length === 1 ? nextTypes[0] : null, { shouldDirty: true });
                }}
              >
                <IconBubble icon={type === "house" ? Home : Building2} />
                <strong>{propertyTypeLabels[type]}</strong>
                {selectedPropertyTypes.includes(type) ? <Check size={18} aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <FormError errors={form.formState.errors} path="property.types" />
        </div>
        <div className={`${styles.compactFieldGrid} ${styles.budgetFieldGrid}`}>
          <label className={styles.field}>
            Budget ideal
            <input type="number" inputMode="numeric" {...register("property.idealBudget", { valueAsNumber: true })} />
            <span className={`${styles.hint} ${styles.invisibleHint}`}>Hors frais de notaire</span>
            <FormError errors={form.formState.errors} path="property.idealBudget" />
          </label>
          <label className={styles.field}>
            Budget maximum
            <input type="number" inputMode="numeric" {...register("property.maximumBudget", { valueAsNumber: true })} />
            <span className={styles.hint}>Hors frais de notaire</span>
            <FormError errors={form.formState.errors} path="property.maximumBudget" />
          </label>
        </div>
        <label className={styles.rangeField}>
          <span>
            Surface habitable minimale
            <strong>
              {characteristics.minimumLivingArea
                ? `${characteristics.minimumLivingArea} m2`
                : "Non renseignee"}
            </strong>
          </span>
          <input
            type="range"
            min={20}
            max={300}
            step={5}
            value={characteristics.minimumLivingArea ?? 20}
            onChange={(event) =>
              setValue("characteristics.minimumLivingArea", Number(event.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <FormError errors={form.formState.errors} path="characteristics.minimumLivingArea" />
        </label>
        <div className={styles.compactCounters}>
          <CounterInput
            label="Pieces min."
            shortLabel="Pieces"
            value={characteristics.minimumRooms ?? 0}
            onMinus={() => updateCounter("minimumRooms", -1, 0)}
            onPlus={() => updateCounter("minimumRooms", 1, 0)}
          />
          <CounterInput
            label="Chambres min."
            shortLabel="Chambres"
            value={characteristics.minimumBedrooms ?? 0}
            onMinus={() => updateCounter("minimumBedrooms", -1, 0)}
            onPlus={() => updateCounter("minimumBedrooms", 1, 0)}
          />
          <CounterInput
            label="Salles d'eau min."
            shortLabel="SDE"
            value={characteristics.minimumBathrooms ?? 0}
            onMinus={() => updateCounter("minimumBathrooms", -1, 0)}
            onPlus={() => updateCounter("minimumBathrooms", 1, 0)}
          />
        </div>
        <InfoLine text="Ces informations nous aident a vous proposer les biens les plus pertinents." />
      </div>
      <SearchSummaryAside data={watch()} />
    </section>
  );
}

function StepCharacteristics({ form }: StepProps) {
  const { register, setValue, watch } = form;
  const characteristics = watch("characteristics");

  function updateCounter(path: keyof BuyerSearchFormData["characteristics"], delta: number, min: number) {
    const value = characteristics[path] ?? min;
    setValue(`characteristics.${path}`, Math.max(min, value + delta), { shouldDirty: true, shouldValidate: true });
  }

  return (
    <section className={styles.twoColumn}>
      <div className={styles.formColumn}>
        <label className={styles.field}>
          Surface habitable minimale
          <input
            type="number"
            inputMode="numeric"
            {...register("characteristics.minimumLivingArea", { valueAsNumber: true })}
          />
          <FormError errors={form.formState.errors} path="characteristics.minimumLivingArea" />
        </label>
        <CounterInput
          label="Nombre de pieces minimum"
          value={characteristics.minimumRooms ?? 0}
          onMinus={() => updateCounter("minimumRooms", -1, 0)}
          onPlus={() => updateCounter("minimumRooms", 1, 0)}
        />
        <CounterInput
          label="Nombre de chambres minimum"
          value={characteristics.minimumBedrooms ?? 0}
          onMinus={() => updateCounter("minimumBedrooms", -1, 0)}
          onPlus={() => updateCounter("minimumBedrooms", 1, 0)}
        />
        <CounterInput
          label="Nombre de salles d'eau minimum"
          value={characteristics.minimumBathrooms ?? 0}
          onMinus={() => updateCounter("minimumBathrooms", -1, 0)}
          onPlus={() => updateCounter("minimumBathrooms", 1, 0)}
        />
      </div>
      <SearchSummaryAside data={watch()} />
    </section>
  );
}

function StepPreferences({ form }: StepProps) {
  const { setValue, watch } = form;
  const property = watch("property");
  const preferences = watch("preferences");
  const selectedPropertyTypes = normalizePropertyTypes(property.types?.length ? property.types : property.type);
  const groups = getPreferenceOptions(selectedPropertyTypes);

  function toggle(group: keyof BuyerSearchFormData["preferences"], key: string) {
    const current = preferences[group];
    if (!Array.isArray(current)) {
      return;
    }
    const next = current.includes(key) ? current.filter((value) => value !== key) : [...current, key];
    setValue(`preferences.${group}`, next, { shouldDirty: true });

    if (key === "minimum_land_area") {
      setValue("preferences.minimumLandArea", current.includes(key) ? null : (preferences.minimumLandArea ?? DEFAULT_MINIMUM_LAND_AREA), {
        shouldDirty: true,
      });
    }
  }

  function updateMinimumLandArea(value: number) {
    if (!preferences.outdoor.includes("minimum_land_area")) {
      setValue("preferences.outdoor", [...preferences.outdoor, "minimum_land_area"], { shouldDirty: true });
    }

    setValue("preferences.minimumLandArea", value, { shouldDirty: true });
  }

  return (
    <section className={styles.preferenceGrid}>
      <PreferenceGroup title="Stationnement" icon={Car} iconSrc={EQUIPMENT_ICONS.parking} options={groups.parking} selected={preferences.parking} onToggle={(key) => toggle("parking", key)} />
      <PreferenceGroup
        title={selectedPropertyTypes.length === 1 && selectedPropertyTypes[0] === "apartment" ? "Exterieur" : "Exterieur et terrain"}
        icon={Trees}
        iconSrc={EQUIPMENT_ICONS.outdoor}
        options={groups.outdoor}
        selected={preferences.outdoor}
        onToggle={(key) => toggle("outdoor", key)}
        minimumLandArea={preferences.minimumLandArea}
        onMinimumLandAreaChange={updateMinimumLandArea}
      />
      {groups.buildingComfort.length > 0 ? (
        <PreferenceGroup title="Confort de l'immeuble" icon={Building2} iconSrc={EQUIPMENT_ICONS.buildingComfort} options={groups.buildingComfort} selected={preferences.buildingComfort} onToggle={(key) => toggle("buildingComfort", key)} />
      ) : null}
      {groups.houseEquipment.length > 0 ? (
        <PreferenceGroup title="Equipements maison" icon={Home} iconSrc={EQUIPMENT_ICONS.houseEquipment} options={groups.houseEquipment} selected={preferences.houseEquipment} onToggle={(key) => toggle("houseEquipment", key)} />
      ) : null}
      {groups.additionalSpaces.length > 0 ? (
        <PreferenceGroup title="Espaces complementaires" icon={WalletCards} iconSrc={EQUIPMENT_ICONS.additionalSpaces} options={groups.additionalSpaces} selected={preferences.additionalSpaces} onToggle={(key) => toggle("additionalSpaces", key)} />
      ) : null}
      <PreferenceGroup title="Travaux" icon={Sparkles} iconSrc={EQUIPMENT_ICONS.works} options={groups.works} selected={preferences.works} onToggle={(key) => toggle("works", key)} />
      <PreferenceGroup title="Environnement" icon={Trees} iconSrc={EQUIPMENT_ICONS.environment} options={groups.environment} selected={preferences.environment} onToggle={(key) => toggle("environment", key)} wide />
    </section>
  );
}

function StepProject({ form }: StepProps) {
  const { setValue, watch } = form;
  const project = watch("project");

  return (
    <section className={styles.projectStack}>
      <ProjectQuestion
        number="01"
        icon={CalendarDays}
        title="Quand souhaitez-vous acheter ?"
        options={purchaseTimelineOptions}
        value={project.purchaseTimeline}
        onSelect={(key) => setValue("project.purchaseTimeline", key, { shouldDirty: true, shouldValidate: true })}
      />
      <ProjectQuestion
        number="02"
        icon={WalletCards}
        title="Ou en est votre financement ?"
        options={financingOptions}
        value={project.financingStatus}
        onSelect={(key) => setValue("project.financingStatus", key, { shouldDirty: true, shouldValidate: true })}
      />
      <ProjectQuestion
        number="03"
        icon={CircleUserRound}
        title="Quelle est votre situation actuelle ?"
        options={situationOptions}
        value={project.currentSituation}
        onSelect={(key) => setValue("project.currentSituation", key, { shouldDirty: true, shouldValidate: true })}
      />
      <FormError errors={form.formState.errors} path="project.purchaseTimeline" />
      <FormError errors={form.formState.errors} path="project.financingStatus" />
      <FormError errors={form.formState.errors} path="project.currentSituation" />
    </section>
  );
}

function StepSummary({ form, goToStep }: StepProps) {
  const data = form.watch();
  const rows = getSummaryRows(data);

  return (
    <section className={styles.summaryGrid}>
      {rows.map((row) => (
        <article className={styles.summaryCard} key={row.title}>
          <IconBubble icon={row.icon} />
          <div>
            <h3>{row.title}</h3>
            <p>{row.value}</p>
          </div>
          <button type="button" onClick={() => goToStep(row.step)}>
            <Pencil size={16} aria-hidden="true" />
            Modifier
          </button>
        </article>
      ))}
    </section>
  );
}

function StepPriorities({ form }: StepProps) {
  const { setValue, watch } = form;
  const priorities = watch("priorities");
  const [filter, setFilter] = useState("all");
  const categories = Array.from(new Set(priorities.map((priority) => priority.category)));
  const visiblePriorities = filter === "all" ? priorities : priorities.filter((priority) => priority.category === filter);

  function updatePriority(key: string, level: PriorityLevel) {
    setValue(
      "priorities",
      priorities.map((priority) => (priority.key === key ? { ...priority, level } : priority)),
      { shouldDirty: true },
    );
  }

  return (
    <section className={styles.prioritySection}>
      <div className={styles.priorityFilters}>
        <button type="button" data-selected={filter === "all" || undefined} onClick={() => setFilter("all")}>
          Tous les criteres ({priorities.length})
        </button>
        {categories.map((category) => (
          <button type="button" key={category} data-selected={filter === category || undefined} onClick={() => setFilter(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className={styles.priorityList}>
        {visiblePriorities.map((priority) => (
          <article className={styles.priorityRow} key={priority.key}>
            <span className={styles.dragHandle} aria-hidden="true">::</span>
            <IconBubble icon={iconForCategory(priority.category)} />
            <strong>{priority.label}</strong>
            <div className={styles.prioritySwitch} role="group" aria-label={`${priority.label} : niveau de priorite`}>
              <button
                type="button"
                data-selected={priority.level === "desired" || undefined}
                onClick={() => updatePriority(priority.key, "desired")}
              >
                <Heart size={16} aria-hidden="true" />
                Souhaite
              </button>
              <button
                type="button"
                data-selected={priority.level === "essential" || undefined}
                onClick={() => updatePriority(priority.key, "essential")}
              >
                <Star size={16} aria-hidden="true" />
                Indispensable
              </button>
            </div>
            <ChevronDown size={18} aria-hidden="true" />
          </article>
        ))}
        {visiblePriorities.length === 0 ? <InfoLine text="Aucun critere selectionne pour le moment." /> : null}
      </div>
      <button className={styles.addDashed} type="button">
        <Plus size={18} aria-hidden="true" />
        Ajouter un critere manquant
      </button>
    </section>
  );
}

function StepContact({ clientEmail, form }: StepProps & { clientEmail: string | null }) {
  const { register, setValue, watch } = form;
  const contact = watch("contact");

  return (
    <section className={styles.contactLayout}>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          Prenom *
          <input placeholder="Ex. : Claire" {...register("contact.firstName")} />
          <FormError errors={form.formState.errors} path="contact.firstName" />
        </label>
        <label className={styles.field}>
          Nom *
          <input placeholder="Ex. : Dupont" {...register("contact.lastName")} />
          <FormError errors={form.formState.errors} path="contact.lastName" />
        </label>
      </div>
      <label className={styles.field}>
        Email *
        <input
          placeholder="exemple@mail.fr"
          readOnly={Boolean(clientEmail)}
          type="email"
          {...register("contact.email")}
        />
        {clientEmail ? <small>Adresse liee a votre compte client.</small> : null}
        <FormError errors={form.formState.errors} path="contact.email" />
      </label>
      <label className={styles.field}>
        Telephone *
        <span className={styles.searchInput}>
          <Phone size={18} aria-hidden="true" />
          <input placeholder="06 12 34 56 78" type="tel" {...register("contact.phone")} />
        </span>
        <FormError errors={form.formState.errors} path="contact.phone" />
      </label>
      <div className={styles.optionBlock}>
        <h3>Contact privilegie *</h3>
        <div className={styles.channelGrid}>
          {preferredChannelOptions.map((option) => (
            <button
              type="button"
              className={styles.channelCard}
              data-selected={contact.preferredChannel === option.key || undefined}
              key={option.key}
              onClick={() =>
                setValue("contact.preferredChannel", option.key as BuyerSearchFormData["contact"]["preferredChannel"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <span className={styles.radioDot} aria-hidden="true" />
              {option.key === "email" ? <Mail size={24} /> : option.key === "sms" ? <MessageIcon /> : <Phone size={24} />}
              <span>
                <strong>{option.label}</strong>
                <small>{option.helper}</small>
              </span>
            </button>
          ))}
        </div>
        <FormError errors={form.formState.errors} path="contact.preferredChannel" />
      </div>
      <label className={styles.consentBox}>
        <input type="checkbox" {...register("contact.consent")} />
        <span>
          J&apos;accepte d&apos;etre recontacte au sujet de ma recherche immobiliere et de recevoir des biens correspondant a mes criteres.
          <a href="#">En savoir plus sur l&apos;utilisation de vos donnees</a>
        </span>
      </label>
      <FormError errors={form.formState.errors} path="contact.consent" />
    </section>
  );
}

function LocationMap({ cities }: { cities: BuyerSearchCity[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapStatus, setMapStatus] = useState<"ready" | "missing-token" | "error">(
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? "ready" : "missing-token",
  );
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!accessToken) {
      setMapStatus("missing-token");
      return;
    }

    let cancelled = false;

    async function initializeMap() {
      const mapboxModule = await import("mapbox-gl");
      const mapbox = mapboxModule.default;

      if (cancelled || !containerRef.current) {
        return;
      }

      mapbox.accessToken = accessToken;

      const center = getMapCenter(cities);
      const radiusFeatureCollection = buildRadiusFeatureCollection(cities);
      const map = new mapbox.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center,
        zoom: cities.length > 1 ? 9.6 : 11,
        attributionControl: true,
      });

      mapRef.current = map;
      map.addControl(new mapbox.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        setMapStatus("ready");

        map.addSource("buyer-search-radius", {
          type: "geojson",
          data: radiusFeatureCollection,
        });

        map.addLayer({
          id: "buyer-search-radius-fill",
          type: "fill",
          source: "buyer-search-radius",
          paint: {
            "fill-color": "#d6b48c",
            "fill-opacity": 0.14,
          },
        });

        map.addLayer({
          id: "buyer-search-radius-line",
          type: "line",
          source: "buyer-search-radius",
          paint: {
            "line-color": "#111111",
            "line-dasharray": [2, 2],
            "line-width": 1.5,
          },
        });
      });

      cities.forEach((city) => {
        if (typeof city.longitude !== "number" || typeof city.latitude !== "number") {
          return;
        }

        const markerElement = document.createElement("div");
        markerElement.className = styles.mapboxMarker;
        markerElement.setAttribute("aria-label", city.name);

        const marker = new mapbox.Marker({ element: markerElement })
          .setLngLat([city.longitude, city.latitude])
          .setPopup(new mapbox.Popup({ offset: 18 }).setText(city.name))
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (radiusFeatureCollection.features.length > 0) {
        const bounds = new mapbox.LngLatBounds();

        radiusFeatureCollection.features.forEach((feature) => {
          feature.geometry.coordinates[0].forEach((coordinate) => {
            bounds.extend(coordinate);
          });
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 52, maxZoom: 12, duration: 0 });
        }
      }

      map.on("error", () => setMapStatus("error"));
    }

    initializeMap().catch(() => setMapStatus("error"));

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [accessToken, cities]);

  return (
    <aside className={styles.mapPanel} aria-label="Apercu cartographique">
      {mapStatus === "missing-token" || mapStatus === "error" ? (
        <div className={styles.fakeMap}>
          <span className={styles.radiusCircle} />
          <span className={styles.mapBadge}>Rayon par ville</span>
          {cities.map((city, index) => (
            <span className={styles.mapMarker} style={{ left: `${34 + index * 18}%`, top: `${48 - index * 10}%` }} key={city.name}>
              <MapPin size={28} fill="#111111" aria-hidden="true" />
              <small>{city.name} - {city.radiusKm ?? DEFAULT_CITY_RADIUS_KM} km</small>
            </span>
          ))}
          <span className={styles.mapFooter}>
            {mapStatus === "missing-token" ? "Token Mapbox a configurer" : "Carte momentanement indisponible"}
          </span>
        </div>
      ) : (
        <div className={styles.mapboxMap} ref={containerRef}>
          <span className={styles.mapBadge}>Rayon par ville</span>
          <span className={styles.mapFooter}>Rayon applique autour de chaque ville</span>
        </div>
      )}
    </aside>
  );
}

function getCityKey(city: BuyerSearchCity) {
  return city.cityCode ?? `${city.name}-${city.postalCode ?? ""}`;
}

function withCityRadius(city: BuyerSearchCity, fallbackRadiusKm = DEFAULT_CITY_RADIUS_KM) {
  return {
    ...city,
    radiusKm: city.radiusKm ?? fallbackRadiusKm,
  };
}

function getCityDedupKey(city: BuyerSearchCity) {
  return city.name.trim().toLowerCase();
}

function areSameCity(firstCity: BuyerSearchCity, secondCity: BuyerSearchCity) {
  if (firstCity.cityCode && secondCity.cityCode) {
    return firstCity.cityCode === secondCity.cityCode;
  }

  return getCityDedupKey(firstCity) === getCityDedupKey(secondCity);
}

function dedupeCities(cities: BuyerSearchCity[]) {
  return cities.reduce<BuyerSearchCity[]>((uniqueCities, city) => {
    if (uniqueCities.some((candidate) => areSameCity(candidate, city))) {
      return uniqueCities;
    }

    return [...uniqueCities, city];
  }, []);
}

function normalizeSelectedCities(cities: BuyerSearchCity[], fallbackRadiusKm = DEFAULT_CITY_RADIUS_KM) {
  return dedupeCities(cities).map((city) => withCityRadius(city, fallbackRadiusKm));
}

function areCityListsEqual(firstList: BuyerSearchCity[], secondList: BuyerSearchCity[]) {
  if (firstList.length !== secondList.length) {
    return false;
  }

  return firstList.every((city, index) => {
    const otherCity = secondList[index];
    return otherCity ? areSameCity(city, otherCity) && city.radiusKm === otherCity.radiusKm : false;
  });
}

function formatLocationSummary(cities: BuyerSearchCity[]) {
  if (cities.length === 0) {
    return "Non renseigne";
  }

  return cities.map((city) => `${city.name} (${city.radiusKm ?? DEFAULT_CITY_RADIUS_KM} km)`).join(", ");
}

function formatPropertyTypes(data: BuyerSearchFormData) {
  const selectedTypes = normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type);

  return selectedTypes.length > 0
    ? selectedTypes.map((type) => propertyTypeLabels[type]).join(", ")
    : "Non renseigne";
}

function resetCharacteristicCounters(data: BuyerSearchFormData): BuyerSearchFormData {
  return {
    ...data,
    characteristics: {
      ...data.characteristics,
      minimumRooms: 0,
      minimumBedrooms: 0,
      minimumBathrooms: 0,
    },
  };
}

function resetPreferenceSelections(data: BuyerSearchFormData): BuyerSearchFormData {
  return {
    ...data,
    preferences: {
      ...data.preferences,
      parking: [],
      outdoor: [],
      buildingComfort: [],
      additionalSpaces: [],
      houseEquipment: [],
      works: [],
      environment: [],
      maximumFloor: null,
      minimumLandArea: null,
    },
  };
}

function formatCityPostalCodes(city: BuyerSearchCity) {
  const postalCodes = city.postalCodes?.length ? city.postalCodes : city.postalCode ? [city.postalCode] : [];

  return postalCodes.slice(0, 3).join(", ");
}

function getMapCenter(cities: BuyerSearchCity[]): [number, number] {
  const geocodedCities = cities.filter(
    (city) => typeof city.longitude === "number" && typeof city.latitude === "number",
  );

  if (geocodedCities.length === 0) {
    return [5.5707, 43.2928];
  }

  const sums = geocodedCities.reduce(
    (accumulator, city) => ({
      longitude: accumulator.longitude + (city.longitude ?? 0),
      latitude: accumulator.latitude + (city.latitude ?? 0),
    }),
    { longitude: 0, latitude: 0 },
  );

  return [sums.longitude / geocodedCities.length, sums.latitude / geocodedCities.length];
}

function buildRadiusFeature(center: [number, number], radiusKm: number) {
  const [centerLongitude, centerLatitude] = center;
  const earthRadiusKm = 6371;
  const points = 96;
  const coordinates: Array<[number, number]> = [];

  for (let index = 0; index <= points; index += 1) {
    const bearing = (index / points) * 2 * Math.PI;
    const angularDistance = radiusKm / earthRadiusKm;
    const latitudeRad = (centerLatitude * Math.PI) / 180;
    const longitudeRad = (centerLongitude * Math.PI) / 180;

    const pointLatitude = Math.asin(
      Math.sin(latitudeRad) * Math.cos(angularDistance) +
        Math.cos(latitudeRad) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLongitude =
      longitudeRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRad),
        Math.cos(angularDistance) - Math.sin(latitudeRad) * Math.sin(pointLatitude),
      );

    coordinates.push([(pointLongitude * 180) / Math.PI, (pointLatitude * 180) / Math.PI]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
  };
}

function buildRadiusFeatureCollection(cities: BuyerSearchCity[]) {
  const geocodedCities = cities.filter(
    (city) => typeof city.longitude === "number" && typeof city.latitude === "number",
  );

  return {
    type: "FeatureCollection" as const,
    features:
      geocodedCities.length > 0
        ? geocodedCities.map((city) =>
            buildRadiusFeature([city.longitude ?? 0, city.latitude ?? 0], city.radiusKm ?? DEFAULT_CITY_RADIUS_KM),
          )
        : [buildRadiusFeature(getMapCenter(cities), DEFAULT_CITY_RADIUS_KM)],
  };
}

function SearchSummaryAside({ data }: { data: BuyerSearchFormData }) {
  return (
    <aside className={styles.asideSummary}>
      <h2>Votre recherche en resume</h2>
      <div className={styles.houseSketch} aria-hidden="true">
        <Home size={92} />
      </div>
      <SummaryLine icon={Home} label="Type de bien" value={formatPropertyTypes(data)} />
      <SummaryLine icon={Euro} label="Budget maximum" value={formatCurrency(data.property.maximumBudget)} />
      <SummaryLine icon={Ruler} label="Surface min." value={data.characteristics.minimumLivingArea ? `${data.characteristics.minimumLivingArea} m2` : "Non renseignee"} />
      <SummaryLine icon={BedDouble} label="Chambres min." value={String(data.characteristics.minimumBedrooms ?? 0)} />
    </aside>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className={styles.summaryLine}>
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PreferenceGroup({
  title,
  icon,
  iconSrc,
  minimumLandArea,
  onMinimumLandAreaChange,
  options,
  selected,
  onToggle,
  wide,
}: {
  title: string;
  icon: typeof Home;
  iconSrc?: string;
  minimumLandArea?: number | null;
  onMinimumLandAreaChange?: (value: number) => void;
  options: Array<{ key: string; label: string; helper?: string }>;
  selected: string[];
  onToggle: (key: string) => void;
  wide?: boolean;
}) {
  return (
    <article className={styles.preferenceGroup} data-wide={wide || undefined}>
      <div className={styles.groupTitle}>
        <IconBubble icon={icon} src={iconSrc} />
        <h3>{title}</h3>
      </div>
      <div className={styles.preferenceOptions}>
        {options.map((option) => (
          <div className={styles.preferenceOptionWrapper} key={option.key}>
            <button
              className={styles.preferenceOption}
              data-selected={selected.includes(option.key) || undefined}
              type="button"
              onClick={() => onToggle(option.key)}
            >
              <span className={styles.preferenceOptionText}>
                <span>{option.label}</span>
                {option.helper ? <small>{option.helper}</small> : null}
              </span>
              <span className={styles.checkCircle}>{selected.includes(option.key) ? <Check size={14} /> : null}</span>
            </button>
            {option.key === "minimum_land_area" && selected.includes(option.key) && onMinimumLandAreaChange ? (
              <div className={styles.preferenceRange}>
                <span>
                  Surface souhaitee
                  <strong>{minimumLandArea ?? DEFAULT_MINIMUM_LAND_AREA} m2</strong>
                </span>
                <input
                  aria-label="Surface de terrain minimum souhaitee"
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={minimumLandArea ?? DEFAULT_MINIMUM_LAND_AREA}
                  onChange={(event) => onMinimumLandAreaChange(Number(event.target.value))}
                />
                <span className={styles.rangeTicks} aria-hidden="true">
                  <small>100</small>
                  <small>750</small>
                  <small>1500</small>
                  <small>3000 m2</small>
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function ProjectQuestion({
  number,
  icon,
  title,
  options,
  value,
  onSelect,
}: {
  number: string;
  icon: typeof Home;
  title: string;
  options: Array<{ key: string; label: string }>;
  value: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <article className={styles.projectQuestion}>
      <div className={styles.questionTitle}>
        <IconBubble icon={icon} />
        <h3><span>{number}.</span> {title}</h3>
        <ChevronDown size={22} aria-hidden="true" />
      </div>
      <div className={styles.projectOptions}>
        {options.map((option) => (
          <button
            type="button"
            data-selected={value === option.key || undefined}
            key={option.key}
            onClick={() => onSelect(option.key)}
          >
            <span>{option.label}</span>
            <span className={styles.radioDot}>{value === option.key ? <Check size={12} /> : null}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function CounterInput({
  label,
  onMinus,
  onPlus,
  shortLabel,
  value,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
  shortLabel?: string;
  value: number;
}) {
  return (
    <div className={styles.counterField}>
      <span>
        <span className={styles.counterLabelFull}>{label}</span>
        <span className={styles.counterLabelShort}>{shortLabel ?? label}</span>
      </span>
      <div className={styles.counter}>
        <button type="button" onClick={onMinus} aria-label={`Diminuer ${label}`}>
          <Minus size={18} />
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={onPlus} aria-label={`Augmenter ${label}`}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function IconBubble({ icon: Icon, src }: { icon: typeof Home; src?: string }) {
  return (
    <span className={styles.iconBubble}>
      {src ? <Image src={src} width={25} height={25} alt="" aria-hidden="true" /> : <Icon size={24} strokeWidth={1.7} aria-hidden="true" />}
    </span>
  );
}

function InfoCallout({ icon: Icon, text }: { icon: typeof Home; text: string }) {
  return (
    <aside className={styles.infoCallout}>
      <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
      <p>{text}</p>
    </aside>
  );
}

function InfoLine({ text }: { text: string }) {
  return (
    <p className={styles.infoLine}>
      <Info size={18} aria-hidden="true" />
      {text}
    </p>
  );
}

function MessageIcon() {
  return <span className={styles.messageIcon} aria-hidden="true" />;
}

function FirstError({
  errors,
  scope,
  refCallback,
}: {
  errors: FieldErrors<BuyerSearchFormData>;
  scope: WizardStepId;
  refCallback: (node: HTMLParagraphElement | null) => void;
}) {
  const message = firstErrorMessage(errors, scope);

  if (!message) {
    return null;
  }

  return (
    <p className={styles.errorSummary} ref={refCallback}>
      {message}
    </p>
  );
}

function FormError({ errors, path }: { errors: FieldErrors<BuyerSearchFormData>; path: string }) {
  const message = getErrorMessage(errors, path);

  if (!message) {
    return null;
  }

  return <span className={styles.fieldError}>{message}</span>;
}

function getErrorMessage(errors: FieldErrors<BuyerSearchFormData>, path: string): string | null {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return null;
  }, errors);

  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message?: string }).message ?? "");
  }

  return null;
}

function firstErrorMessage(errors: FieldErrors<BuyerSearchFormData>, scope: WizardStepId) {
  const scopedErrors = (errors as Record<string, unknown>)[scope];
  const stack: unknown[] = scopedErrors ? [scopedErrors] : [];

  if (scope === "property") {
    const characteristicErrors = (errors as Record<string, unknown>).characteristics;

    if (characteristicErrors) {
      stack.push(characteristicErrors);
    }
  }

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current || typeof current !== "object") {
      continue;
    }
    if ("message" in current && typeof (current as { message?: unknown }).message === "string") {
      return (current as { message: string }).message;
    }
    stack.push(...Object.values(current));
  }

  return null;
}

function getSummaryRows(data: BuyerSearchFormData) {
  return [
    { icon: Home, title: "Bien recherche", value: formatPropertyTypes(data), step: "property" as const },
    { icon: MapPin, title: "Localisation", value: formatLocationSummary(data.location.cities), step: "location" as const },
    { icon: WalletCards, title: "Budget", value: `Ideal : ${formatCurrency(data.property.idealBudget)} - Max : ${formatCurrency(data.property.maximumBudget)}`, step: "property" as const },
    { icon: Ruler, title: "Surface", value: `Minimum ${data.characteristics.minimumLivingArea ?? 0} m2`, step: "property" as const },
    { icon: BedDouble, title: "Pieces et chambres", value: `${data.characteristics.minimumRooms ?? 0} pieces min. - ${data.characteristics.minimumBedrooms ?? 0} chambres min.`, step: "property" as const },
    { icon: Car, title: "Stationnement", value: labelsFor(data, "parking") || "Non renseigne", step: "preferences" as const },
    { icon: Trees, title: "Exterieur", value: labelsFor(data, "outdoor") || "Non renseigne", step: "preferences" as const },
    { icon: Sparkles, title: "Travaux", value: labelsFor(data, "works") || "Non renseigne", step: "preferences" as const },
    { icon: Trees, title: "Environnement", value: labelsFor(data, "environment") || "Non renseigne", step: "preferences" as const },
    { icon: CalendarDays, title: "Votre projet", value: optionLabel(purchaseTimelineOptions, data.project.purchaseTimeline), step: "project" as const },
    { icon: Building2, title: "Financement", value: optionLabel(financingOptions, data.project.financingStatus), step: "project" as const },
    { icon: CircleUserRound, title: "Situation actuelle", value: optionLabel(situationOptions, data.project.currentSituation), step: "project" as const },
  ];
}

function labelsFor(data: BuyerSearchFormData, group: keyof BuyerSearchFormData["preferences"]) {
  const selected = data.preferences[group];
  if (!Array.isArray(selected)) {
    return "";
  }
  const options = allPreferenceOptions(data.property.types?.length ? data.property.types : data.property.type);
  return selected
    .map((key) => {
      if (key === "minimum_land_area" && data.preferences.minimumLandArea) {
        return `Terrain ${data.preferences.minimumLandArea} m2 min.`;
      }

      return optionLabel(options, key);
    })
    .filter(Boolean)
    .join(", ");
}

function buildPriorityItems(data: BuyerSearchFormData): BuyerSearchFormData["priorities"] {
  const options = allPreferenceOptions(data.property.types?.length ? data.property.types : data.property.type);
  const existing = new Map(data.priorities.map((priority) => [priority.key, priority.level]));
  const selected = Object.entries(data.preferences)
    .filter(([, value]) => Array.isArray(value))
    .flatMap(([group, values]) =>
      (values as string[]).map((value) => {
        const option = options.find((candidate) => candidate.key === value);
        const isMinimumLandArea = value === "minimum_land_area" && typeof data.preferences.minimumLandArea === "number";
        return option
          ? {
              key: `${group}-${value}`,
              label: isMinimumLandArea ? `Surface terrain min. ${data.preferences.minimumLandArea} m2` : option.label,
              value: isMinimumLandArea ? String(data.preferences.minimumLandArea) : value,
              category: option.category,
              level: existing.get(`${group}-${value}`) ?? "desired",
            }
          : null;
      }),
    )
    .filter(Boolean) as BuyerSearchFormData["priorities"];

  if (data.characteristics.minimumLivingArea) {
    selected.push({
      key: "characteristics-minimumLivingArea",
      label: `Surface minimum ${data.characteristics.minimumLivingArea} m2`,
      value: String(data.characteristics.minimumLivingArea),
      category: "Logement",
      level: existing.get("characteristics-minimumLivingArea") ?? "desired",
    });
  }

  return selected;
}

function iconForCategory(category: string) {
  if (category.includes("Stationnement")) return Car;
  if (category.includes("Exterieur")) return Trees;
  if (category.includes("Travaux")) return Sparkles;
  if (category.includes("Environnement")) return MapPin;
  if (category.includes("Logement")) return Ruler;
  return Home;
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "Non renseigne";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function LiveDraftDebugger({ data }: { data: BuyerSearchFormData }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("Buyer search draft", data);
    }
  }, [data]);

  return null;
}

"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import type { DirectoryCity } from "./city-directory";
import {
  findCitySearchMatch,
  getCitySearchOptionLabel,
} from "./city-hero-search-utils";
import styles from "./prix-m2.module.css";

export function CityHeroSearch({ cities }: { cities: DirectoryCity[] }) {
  const router = useRouter();
  const suggestionsId = useId();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const city = findCitySearchMatch(cities, query);

    if (!city) {
      setError("Sélectionnez une ville proposée ou saisissez un code postal disponible.");
      return;
    }

    router.push(`/prix-m2/${city.slug}`);
  }

  return (
    <div className={styles.heroSearchWrap}>
      <form className={styles.heroSearch} onSubmit={handleSubmit}>
        <label className={styles.heroSearchField}>
          <span className={styles.visuallyHidden}>Rechercher une ville ou un code postal</span>
          <Search aria-hidden="true" size={25} strokeWidth={1.7} />
          <input
            aria-describedby={error ? `${suggestionsId}-error` : undefined}
            data-testid="city-hero-search"
            list={suggestionsId}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            placeholder="Rechercher une ville ou un code postal"
            type="search"
            value={query}
          />
          <datalist id={suggestionsId}>
            {cities.map((city) => (
              <option key={city.slug} value={getCitySearchOptionLabel(city)} />
            ))}
          </datalist>
        </label>
        <button type="submit">
          Voir les prix <ArrowRight aria-hidden="true" size={17} />
        </button>
      </form>
      {error ? <p className={styles.heroSearchError} id={`${suggestionsId}-error`}>{error}</p> : null}
    </div>
  );
}

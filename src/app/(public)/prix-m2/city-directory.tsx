"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Search } from "lucide-react";
import { useState } from "react";
import styles from "./prix-m2.module.css";

export type DirectoryCity = {
  apartmentPrice: number;
  averagePrice: number;
  departmentCode: "13" | "83";
  housePrice: number;
  name: string;
  postalCode: string;
  slug: string;
  trend: number;
};

type DepartmentFilter = "all" | "13" | "83";
type SortOrder = "alphabetical" | "price-asc" | "price-desc";

const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CityDirectory({ cities }: { cities: DirectoryCity[] }) {
  const [department, setDepartment] = useState<DepartmentFilter>("all");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("alphabetical");

  const normalizedQuery = normalizeSearch(query.trim());
  const filteredCities = cities
    .filter((city) => department === "all" || city.departmentCode === department)
    .filter((city) =>
      normalizeSearch(`${city.name} ${city.postalCode}`).includes(normalizedQuery),
    )
    .sort((cityA, cityB) => {
      if (sortOrder === "price-asc") return cityA.averagePrice - cityB.averagePrice;
      if (sortOrder === "price-desc") return cityB.averagePrice - cityA.averagePrice;
      return cityA.name.localeCompare(cityB.name, "fr");
    });

  const departments = [
    { code: "13" as const, label: "Bouches-du-Rhône (13)" },
    { code: "83" as const, label: "Var (83)" },
  ];

  return (
    <div className={styles.directory}>
      <div className={styles.filters}>
        <label className={styles.searchField}>
          <span className={styles.visuallyHidden}>Rechercher une ville ou un code postal</span>
          <Search aria-hidden="true" size={19} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une ville ou un code postal"
            type="search"
            value={query}
          />
        </label>
        <div className={styles.departmentFilters} aria-label="Filtrer par département">
          <button
            aria-pressed={department === "all"}
            onClick={() => setDepartment("all")}
            type="button"
          >
            Toutes les villes
          </button>
          <button
            aria-pressed={department === "13"}
            onClick={() => setDepartment("13")}
            type="button"
          >
            Bouches-du-Rhône
          </button>
          <button
            aria-pressed={department === "83"}
            onClick={() => setDepartment("83")}
            type="button"
          >
            Var
          </button>
        </div>
        <label className={styles.sortField}>
          <span>Trier</span>
          <select
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            value={sortOrder}
          >
            <option value="alphabetical">Ordre alphabétique</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {filteredCities.length} ville{filteredCities.length > 1 ? "s" : ""} disponible{filteredCities.length > 1 ? "s" : ""}
      </p>

      {filteredCities.length > 0 ? (
        <div className={styles.departmentGrid}>
          {departments.map(({ code, label }) => {
            const departmentCities = filteredCities.filter(
              (city) => city.departmentCode === code,
            );

            if (departmentCities.length === 0) return null;

            return (
              <section className={styles.departmentPanel} key={code} aria-labelledby={`department-${code}`}>
                <div className={styles.departmentHeading}>
                  <div>
                    <span>Département {code}</span>
                    <h3 id={`department-${code}`}>{label}</h3>
                  </div>
                  <strong>{departmentCities.length} villes</strong>
                </div>
                <div className={styles.cityList}>
                  {departmentCities.map((city) => {
                    const TrendIcon = city.trend >= 0 ? ArrowUp : ArrowDown;
                    const seoTitle = `Prix m² à ${city.name}`;

                    return (
                      <Link
                        className={styles.cityLink}
                        href={`/prix-m2/${city.slug}`}
                        key={city.slug}
                        title={seoTitle}
                      >
                        <div className={styles.cityIdentity}>
                          <span>{city.postalCode}</span>
                          <h4>{seoTitle}</h4>
                          <small>Appartement {formatter.format(city.apartmentPrice)} · Maison {formatter.format(city.housePrice)} €/m²</small>
                        </div>
                        <div className={styles.cityPrice}>
                          <span>Prix moyen indicatif</span>
                          <strong>{formatter.format(city.averagePrice)} €<small>/m²</small></strong>
                        </div>
                        <span className={city.trend >= 0 ? styles.positiveTrend : styles.negativeTrend}>
                          <TrendIcon aria-hidden="true" size={14} />
                          {city.trend > 0 ? "+" : ""}{city.trend.toLocaleString("fr-FR")} %
                        </span>
                        <ArrowRight className={styles.cityArrow} aria-hidden="true" size={18} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Search aria-hidden="true" />
          <h3>Aucune ville trouvée</h3>
          <p>Essayez un autre nom ou recherchez directement par code postal.</p>
        </div>
      )}
    </div>
  );
}

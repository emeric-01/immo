"use client";

import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/immo-data";
import { MIN_ADDRESS_QUERY_LENGTH } from "@/lib/immo-data";
import styles from "./home.module.css";

function buildEstimationUrl(address: AddressSuggestion) {
  const params = new URLSearchParams({
    address: address.label,
    latitude: String(address.latitude),
    longitude: String(address.longitude),
  });

  if (address.addressId) params.set("addressId", address.addressId);
  if (address.inseeCode) params.set("inseeCode", address.inseeCode);
  if (address.departmentCode) params.set("departmentCode", address.departmentCode);
  if (address.cityName) params.set("cityName", address.cityName);
  if (address.postCode?.[0]) params.set("postCode", address.postCode[0]);

  return `/estimation?${params.toString()}`;
}

export function HomeAddressSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const value = query.trim();
    if (selectedAddress?.label === value) return;

    setSelectedAddress(null);
    setError(null);
    if (value.length < MIN_ADDRESS_QUERY_LENGTH) {
      abortRef.current?.abort();
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/addresses?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as AddressSuggestion[] | { error?: string };
        if (!response.ok || !Array.isArray(payload)) throw new Error("Recherche indisponible.");
        setSuggestions(payload.slice(0, 6));
        setError(payload.length ? null : "Aucune adresse trouvée.");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setSuggestions([]);
        setError("La recherche d’adresse est momentanément indisponible.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, selectedAddress]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAddress) {
      setError("Sélectionnez une adresse proposée.");
      return;
    }
    router.push(buildEstimationUrl(selectedAddress));
  }

  return (
    <form className={`${styles.addressSearch} ${compact ? styles.addressSearchCompact : ""}`} onSubmit={submit}>
      <div className={styles.addressField}>
        <MapPin aria-hidden="true" size={19} />
        <input
          aria-autocomplete="list"
          aria-controls="home-address-suggestions"
          aria-expanded={suggestions.length > 0}
          aria-label="Adresse du bien"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Adresse de votre bien"
          role="combobox"
          value={query}
        />
        {isLoading ? <span className={styles.addressLoading}>Recherche…</span> : null}
        {suggestions.length > 0 && !selectedAddress ? (
          <div className={styles.addressSuggestions} id="home-address-suggestions" role="listbox">
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.addressId ?? suggestion.label}-${suggestion.longitude}`}
                onClick={() => {
                  setQuery(suggestion.label);
                  setSelectedAddress(suggestion);
                  setSuggestions([]);
                  setError(null);
                }}
                aria-selected="false"
                role="option"
                type="button"
              >
                <MapPin aria-hidden="true" size={15} />
                <span><strong>{suggestion.label}</strong><small>{suggestion.postCode?.[0]} {suggestion.cityName}</small></span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button className={styles.addressSubmit} disabled={!selectedAddress} type="submit">
        {selectedAddress ? <CheckCircle2 aria-hidden="true" size={17} /> : null}
        Estimer mon bien <ArrowRight aria-hidden="true" size={17} />
      </button>
      {error ? <p className={styles.addressError} role="alert">{error}</p> : null}
    </form>
  );
}

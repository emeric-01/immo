"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, MapPin, Phone } from "lucide-react";
import type { AddressSuggestion } from "@/lib/immo-data";
import styles from "./local-agency.module.css";

const agencyPhone = "+33619821984";

export function LocalAgencyQuickActions({ cityName }: { cityName: string }) {
  const [query, setQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const value = query.trim();

    if (value.length < 3 || selectedAddress?.label === value) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/addresses?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setSuggestions(response.ok && Array.isArray(data) ? data : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query, selectedAddress]);

  function startEstimation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddress) return;

    const params = new URLSearchParams({
      address: selectedAddress.label,
      latitude: String(selectedAddress.latitude),
      longitude: String(selectedAddress.longitude),
    });

    if (selectedAddress.addressId) params.set("addressId", selectedAddress.addressId);
    if (selectedAddress.inseeCode) params.set("inseeCode", selectedAddress.inseeCode);
    if (selectedAddress.departmentCode) params.set("departmentCode", selectedAddress.departmentCode);
    if (selectedAddress.cityName) params.set("cityName", selectedAddress.cityName);
    if (selectedAddress.postCode?.[0]) params.set("postCode", selectedAddress.postCode[0]);

    window.location.assign(`/estimation?${params.toString()}`);
  }

  return (
    <div className={styles.quickActions}>
      <div className={styles.quickEstimate}>
        <p className={styles.quickLabel}>Estimation immédiate</p>
        <h3>Commencez par l’adresse du bien</h3>
        <form data-testid="local-quick-estimate" onSubmit={startEstimation}>
          <div className={styles.quickAddressField}>
            <MapPin aria-hidden="true" />
            <input
              aria-autocomplete="list"
              autoComplete="street-address"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedAddress(null);
              }}
              placeholder={`Adresse du bien à ${cityName}`}
              value={query}
            />
            {isLoading ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : null}
          </div>
          {suggestions.length > 0 ? (
            <ul className={styles.quickSuggestions}>
              {suggestions.slice(0, 5).map((suggestion) => (
                <li key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}>
                  <button
                    onClick={() => {
                      setQuery(suggestion.label);
                      setSelectedAddress(suggestion);
                      setSuggestions([]);
                    }}
                    type="button"
                  >
                    <MapPin aria-hidden="true" />{suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button className={styles.quickSubmit} disabled={!selectedAddress} type="submit">
            Estimer ce bien <ArrowRight aria-hidden="true" />
          </button>
        </form>
      </div>

      <div className={styles.callAction}>
        <span><Phone aria-hidden="true" /></span>
        <div><strong>Vous préférez échanger directement ?</strong><small>Appelez-nous pour parler de votre projet.</small></div>
        <button onClick={() => window.location.assign(`tel:${agencyPhone}`)} type="button">
          Appeler l’agence
        </button>
      </div>
    </div>
  );
}

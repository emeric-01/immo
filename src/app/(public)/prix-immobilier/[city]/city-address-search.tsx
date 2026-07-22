"use client";

import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { prioritizeAddressSuggestions } from "@/lib/address-suggestions";
import type { AddressSuggestion } from "@/lib/immo-data";
import { MIN_ADDRESS_QUERY_LENGTH } from "@/lib/immo-data";

type CityAddressSearchProps = {
  cityName: string;
  inseeCode: string;
  postalCode: string;
};

async function requestAddressSuggestions(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/addresses?q=${encodeURIComponent(query)}`, {
    signal,
  });
  const payload = (await response.json()) as AddressSuggestion[] | { error?: string };

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error(Array.isArray(payload) ? "Recherche indisponible." : payload.error);
  }

  return payload;
}

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

export function CityAddressSearch({ cityName, inseeCode, postalCode }: CityAddressSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (selectedAddress?.label === trimmedQuery) return;

    setSelectedAddress(null);
    setError(null);

    if (trimmedQuery.length < MIN_ADDRESS_QUERY_LENGTH) {
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
        const [cityResult, broadResult] = await Promise.allSettled([
          requestAddressSuggestions(`${trimmedQuery}, ${postalCode} ${cityName}`, controller.signal),
          requestAddressSuggestions(trimmedQuery, controller.signal),
        ]);
        const citySuggestions = cityResult.status === "fulfilled" ? cityResult.value : [];
        const broadSuggestions = broadResult.status === "fulfilled" ? broadResult.value : [];

        if (cityResult.status === "rejected" && broadResult.status === "rejected") {
          throw cityResult.reason;
        }

        const prioritizedSuggestions = prioritizeAddressSuggestions(
          citySuggestions,
          broadSuggestions,
          inseeCode,
        );
        setSuggestions(prioritizedSuggestions);
        setError(prioritizedSuggestions.length ? null : "Aucune adresse trouvée.");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setSuggestions([]);
        setError(requestError instanceof Error ? requestError.message : "Recherche indisponible.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [cityName, inseeCode, postalCode, query, selectedAddress]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddress) {
      setError("Sélectionnez une adresse proposée par la Base Adresse Nationale.");
      return;
    }

    router.push(buildEstimationUrl(selectedAddress));
  }

  return (
    <form className="city-address-search" onSubmit={submit}>
      <div className="city-address-form">
        <MapPin aria-hidden="true" size={20} />
        <div className="city-address-input-wrap">
          <input
            aria-autocomplete="list"
            aria-controls="city-address-suggestions"
            aria-expanded={suggestions.length > 0}
            aria-label={`Adresse du bien à ${cityName}`}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Saisissez votre adresse à ${cityName}`}
            role="combobox"
            value={query}
          />
          {isLoading ? <span className="city-address-loading">Recherche BAN…</span> : null}
          {suggestions.length > 0 && !selectedAddress ? (
            <div className="city-address-suggestions" id="city-address-suggestions" role="listbox">
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
                  <MapPin aria-hidden="true" size={16} />
                  <span><strong>{suggestion.label}</strong><small>{suggestion.postCode?.[0]} {suggestion.cityName}</small></span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button disabled={!selectedAddress} type="submit">
          {selectedAddress ? <CheckCircle2 size={17} /> : null}
          Estimer mon bien <ArrowRight size={17} />
        </button>
      </div>
      {error ? <p className="city-address-error" role="alert">{error}</p> : null}
      {selectedAddress ? <p className="city-address-valid"><CheckCircle2 size={14} /> Adresse vérifiée par la BAN</p> : null}
    </form>
  );
}

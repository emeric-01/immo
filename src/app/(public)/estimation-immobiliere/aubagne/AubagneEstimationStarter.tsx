"use client";

import { ArrowRight, Building2, Home, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { AddressSuggestion, RealtyType } from "@/lib/immo-data";
import styles from "./aubagne-estimation.module.css";

export function AubagneEstimationStarter({ cityName, inseeCode }: { cityName: string; inseeCode: string }) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState<RealtyType>("apartment");
  const [rooms, setRooms] = useState("3");
  const [surfaceM2, setSurfaceM2] = useState("70");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = address.trim();

    if (selectedAddress?.label === query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/addresses?q=${encodeURIComponent(`${query} ${cityName}`)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as AddressSuggestion[] | { error?: string };

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) && data.error ? data.error : "Recherche indisponible.");
        }

        setSuggestions(
          data
            .filter((suggestion) => suggestion.inseeCode === inseeCode)
            .slice(0, 5),
        );
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") return;
        setSuggestions([]);
        setError("Impossible de rechercher cette adresse pour le moment.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [address, cityName, inseeCode, selectedAddress]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddress || selectedAddress.label !== address.trim()) {
      setError(`Sélectionnez une adresse proposée à ${cityName}.`);
      return;
    }

    const params = new URLSearchParams({
      address: selectedAddress.label,
      latitude: String(selectedAddress.latitude),
      longitude: String(selectedAddress.longitude),
      propertyType,
      rooms,
      surfaceM2,
      cityName: selectedAddress.cityName ?? cityName,
      inseeCode: selectedAddress.inseeCode ?? inseeCode,
    });

    if (selectedAddress.addressId) params.set("addressId", selectedAddress.addressId);
    if (selectedAddress.departmentCode) params.set("departmentCode", selectedAddress.departmentCode);
    if (selectedAddress.postCode?.[0]) params.set("postCode", selectedAddress.postCode[0]);

    router.push(`/estimation?${params.toString()}`);
  }

  return (
    <form className={styles.estimator} onSubmit={handleSubmit}>
      <div className={styles.estimatorHeading}>
        <div>
          <p>Première estimation</p>
          <h2>Estimez votre maison ou appartement à {cityName}</h2>
        </div>
        <span>Gratuite et sans engagement</span>
      </div>

      <div className={styles.typeSwitch} aria-label="Type de bien">
        <button
          aria-pressed={propertyType === "apartment"}
          className={propertyType === "apartment" ? styles.activeType : ""}
          onClick={() => setPropertyType("apartment")}
          type="button"
        >
          <Building2 aria-hidden="true" size={20} /> Appartement
        </button>
        <button
          aria-pressed={propertyType === "house"}
          className={propertyType === "house" ? styles.activeType : ""}
          onClick={() => setPropertyType("house")}
          type="button"
        >
          <Home aria-hidden="true" size={20} /> Maison
        </button>
      </div>

      <div className={styles.estimatorFields}>
        <label className={styles.addressField}>
          <span>Adresse du bien</span>
          <div className={styles.addressInput}>
            <MapPin aria-hidden="true" size={19} />
            <input
              autoComplete="street-address"
              onChange={(event) => {
                setAddress(event.target.value);
                setSelectedAddress(null);
                setError("");
              }}
              placeholder="Ex. 12 rue de la République"
              required
              value={address}
            />
            {loading ? <small>Recherche…</small> : null}
          </div>
          {suggestions.length > 0 ? (
            <div className={styles.suggestions} role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.addressId ?? suggestion.label}-${suggestion.longitude}`}
                  onClick={() => {
                    setSelectedAddress(suggestion);
                    setAddress(suggestion.label);
                    setSuggestions([]);
                    setError("");
                  }}
                  type="button"
                >
                  <strong>{suggestion.label}</strong>
                  <span>{suggestion.postCode?.[0] ?? ""} {cityName}</span>
                </button>
              ))}
            </div>
          ) : null}
        </label>

        <label>
          <span>Surface</span>
          <div className={styles.numberInput}>
            <input
              inputMode="numeric"
              min="9"
              onChange={(event) => setSurfaceM2(event.target.value)}
              required
              type="number"
              value={surfaceM2}
            />
            <small>m²</small>
          </div>
        </label>

        <label>
          <span>Pièces</span>
          <select onChange={(event) => setRooms(event.target.value)} value={rooms}>
            {[1, 2, 3, 4, 5, 6].map((room) => (
              <option key={room} value={room}>{room}{room === 6 ? "+" : ""}</option>
            ))}
          </select>
        </label>

        <button className={styles.submit} type="submit">
          Continuer <ArrowRight aria-hidden="true" size={19} />
        </button>
      </div>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </form>
  );
}

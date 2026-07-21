"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, LoaderCircle, MapPin, Search } from "lucide-react";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import styles from "../properties.module.css";

type Commune = BuyerSearchFormData["location"]["cities"][number];
type Props = { initialCity?: string | null; initialPostalCode?: string | null; initialInseeCode?: string | null };

export function CommuneAutocomplete({ initialCity, initialPostalCode, initialInseeCode }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState([initialCity, initialPostalCode].filter(Boolean).join(" — "));
  const [city, setCity] = useState(initialCity || "");
  const [postalCode, setPostalCode] = useState(initialPostalCode || "");
  const [inseeCode, setInseeCode] = useState(initialInseeCode || "");
  const [postalCodes, setPostalCodes] = useState(initialPostalCode ? [initialPostalCode] : []);
  const [results, setResults] = useState<Commune[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (!open || value.length < 2 || value === [city, postalCode].filter(Boolean).join(" — ")) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/communes?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Recherche indisponible");
        setResults(await response.json() as Commune[]);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [city, open, postalCode, query]);

  useEffect(() => {
    function close(event: MouseEvent) { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(commune: Commune) {
    const codes = commune.postalCodes?.length ? commune.postalCodes : commune.postalCode ? [commune.postalCode] : [];
    const selectedPostalCode = codes.includes(postalCode) ? postalCode : codes[0] || "";
    setCity(commune.name);
    setInseeCode(commune.cityCode || "");
    setPostalCodes(codes);
    setPostalCode(selectedPostalCode);
    setQuery([commune.name, selectedPostalCode].filter(Boolean).join(" — "));
    setResults([]);
    setOpen(false);
  }

  function edit(value: string) {
    setQuery(value);
    setCity("");
    setPostalCode("");
    setInseeCode("");
    setPostalCodes([]);
    setOpen(true);
  }

  return <div className={`${styles.wide} ${styles.communeField}`} ref={rootRef}>
    <label htmlFor={`${listId}-input`}>Commune et code postal</label>
    <div className={styles.communeInput}>
      <MapPin aria-hidden="true"/>
      <input aria-autocomplete="list" aria-controls={listId} aria-expanded={open} autoComplete="off" id={`${listId}-input`} onChange={(event) => edit(event.target.value)} onFocus={() => setOpen(true)} placeholder="Commencez par saisir une ville ou un code postal" required value={query}/>
      {searching ? <LoaderCircle aria-label="Recherche en cours" className={styles.spin}/> : city ? <Check aria-label="Commune vérifiée"/> : <Search aria-hidden="true"/>}
    </div>
    <input name="city_name" type="hidden" value={city}/>
    <input name="postal_code" type="hidden" value={postalCode}/>
    <input name="insee_code" type="hidden" value={inseeCode}/>
    {open && query.trim().length >= 2 ? <div className={styles.communeResults} id={listId} role="listbox">
      {results.map((commune) => <button key={commune.cityCode || `${commune.name}-${commune.postalCode}`} onClick={() => choose(commune)} role="option" type="button"><MapPin/><span><strong>{commune.name}</strong><small>{(commune.postalCodes?.length ? commune.postalCodes : [commune.postalCode]).filter(Boolean).join(", ")} · INSEE {commune.cityCode}</small></span><Check/></button>)}
      {!searching && results.length === 0 ? <p>Saisissez au moins 2 caractères puis choisissez une commune proposée.</p> : null}
    </div> : null}
    {city ? <div className={styles.communeConfirmation}><span><Check/> Commune vérifiée : <strong>{city}</strong>{inseeCode ? ` · INSEE ${inseeCode}` : ""}</span>{postalCodes.length > 1 ? <label>Code postal<select onChange={(event) => { setPostalCode(event.target.value); setQuery(`${city} — ${event.target.value}`); }} value={postalCode}>{postalCodes.map((code) => <option key={code}>{code}</option>)}</select></label> : postalCode ? <span>Code postal : <strong>{postalCode}</strong></span> : null}</div> : <p className={styles.communeHelp}>Sélectionnez une proposition pour fiabiliser la ville, le code postal et le code INSEE.</p>}
  </div>;
}

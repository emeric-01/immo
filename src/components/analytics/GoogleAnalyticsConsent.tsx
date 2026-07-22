"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./google-analytics-consent.module.css";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-64T2J16ZH4";
const STORAGE_KEY = "jumellesimmo-analytics-consent";
const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;

type ConsentChoice = "accepted" | "refused";
type StoredConsent = { choice: ConsentChoice; updatedAt: number };

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readConsent(): ConsentChoice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as StoredConsent | null;
    if (!stored || Date.now() - stored.updatedAt > CONSENT_DURATION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored.choice;
  } catch {
    return null;
  }
}

function saveConsent(choice: ConsentChoice) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, updatedAt: Date.now() } satisfies StoredConsent));
}

function anonymousId(key: string) {
  let value = localStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
  return value;
}

function sessionId() {
  const key = "jumellesimmo-session";
  let value = sessionStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); }
  return value;
}

function trackFirstPartyPage(pathname: string) {
  const payload = JSON.stringify({ eventType: "page_view", path: pathname, referrer: document.referrer, visitorId: anonymousId("jumellesimmo-visitor"), sessionId: sessionId() });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/site-analytics", new Blob([payload], { type: "application/json" }));
  else void fetch("/api/site-analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
}

export function GoogleAnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    setChoice(readConsent());
    setReady(true);

    const openSettings = () => {
      setChoice(null);
      setReady(true);
    };
    window.addEventListener("jumelles:open-cookie-settings", openSettings);
    return () => window.removeEventListener("jumelles:open-cookie-settings", openSettings);
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;
    trackFirstPartyPage(pathname);
  }, [choice, pathname]);

  useEffect(() => {
    if (choice !== "accepted" || !scriptReady || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title,
    });
  }, [choice, pathname, scriptReady]);

  const updateChoice = (nextChoice: ConsentChoice) => {
    saveConsent(nextChoice);
    setChoice(nextChoice);
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: nextChoice === "accepted" ? "granted" : "denied",
      });
    }
  };

  return (
    <>
      {choice === "accepted" ? (
        <>
          <Script
            id="google-analytics-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('config','${MEASUREMENT_ID}',{send_page_view:false,anonymize_ip:true});`,
            }}
          />
          <Script
            onReady={() => setScriptReady(true)}
            src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {ready && choice === null ? (
        <aside aria-label="Gestion des cookies" className={styles.banner} role="dialog" aria-modal="false">
          <div>
            <strong>Une expérience qui s’améliore avec vous.</strong>
            <p>
              Avec votre accord, nous mesurons l’audience et les parcours afin d’améliorer le site. Aucun usage
              publicitaire n’est activé. <Link href="/mentions-legales#cookies">En savoir plus</Link>
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.refuse} onClick={() => updateChoice("refused")} type="button">
              Refuser
            </button>
            <button className={styles.accept} onClick={() => updateChoice("accepted")} type="button">
              Accepter
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      className={styles.settingsButton}
      onClick={() => window.dispatchEvent(new Event("jumelles:open-cookie-settings"))}
      type="button"
    >
      Gérer mes cookies
    </button>
  );
}

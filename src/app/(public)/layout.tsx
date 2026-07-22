import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public-site/PublicFooter";
import { PublicHeader } from "@/components/public-site/PublicHeader";
import { GoogleAnalyticsConsent } from "@/components/analytics/GoogleAnalyticsConsent";
import styles from "@/components/public-site/public-site.module.css";
import { absoluteUrl } from "@/lib/site";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const agencyJsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": ["RealEstateAgent", "Organization"], "@id": `${absoluteUrl("/")}#organization`, name: "Les Jumelles Immo", url: absoluteUrl("/"), logo: absoluteUrl("/brand/logo-jumelles-immo-black.svg"), image: absoluteUrl("/images/agence-jumelles-immo-hero.webp"), email: "contact@lesjumelles.immo", areaServed: ["Aubagne", "Aix-en-Provence", "Cassis", "Gémenos", "La Ciotat", "Saint-Cyr-sur-Mer"], memberOf: { "@type": "Organization", name: "FNAIM" } },
    { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website`, url: absoluteUrl("/"), name: "Les Jumelles Immo", publisher: { "@id": `${absoluteUrl("/")}#organization` }, inLanguage: "fr-FR" },
  ] };
  return (
    <div className={styles.site}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(agencyJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <PublicHeader />
      <div className={styles.content}>{children}</div>
      <PublicFooter />
      <GoogleAnalyticsConsent />
    </div>
  );
}

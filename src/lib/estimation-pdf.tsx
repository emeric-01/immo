/* eslint-disable jsx-a11y/alt-text -- React PDF images are not DOM img elements. */
import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { AdminEstimation } from "@/lib/admin/estimations";
import type { InseeDistributionItem, InseeHousingProfile } from "@/lib/insee-housing";

const colors = {
  accent: "#b96f41",
  border: "#e5d8cb",
  ink: "#1d1a17",
  muted: "#756f68",
  pale: "#f7efe7",
  soft: "#fcfaf7",
};

const styles = StyleSheet.create({
  page: { backgroundColor: "#fff", color: colors.ink, fontFamily: "Helvetica", fontSize: 9, paddingBottom: 48, paddingHorizontal: 38, paddingTop: 34 },
  coverTop: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 22 },
  logo: { height: 52, marginBottom: 18, objectFit: "contain", width: 160 },
  eyebrow: { color: colors.accent, fontSize: 7, fontWeight: 700, letterSpacing: 1.6, marginBottom: 9, textTransform: "uppercase" },
  title: { fontFamily: "Times-Roman", fontSize: 28, lineHeight: 1.05, marginBottom: 8, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 10, textAlign: "center" },
  valuation: { backgroundColor: colors.pale, borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginTop: 24, padding: 22 },
  valuationLabel: { color: colors.accent, fontSize: 7, fontWeight: 700, letterSpacing: 1.4, marginBottom: 9, textAlign: "center", textTransform: "uppercase" },
  range: { alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 14 },
  rangePrice: { fontFamily: "Times-Roman", fontSize: 21 },
  rangeDash: { color: colors.accent, fontSize: 14, marginHorizontal: 14 },
  central: { borderTopColor: "#d8c4b2", borderTopWidth: 1, paddingTop: 12, textAlign: "center" },
  centralPrice: { fontSize: 18, fontWeight: 700, marginBottom: 3 },
  centralCaption: { color: colors.muted, fontSize: 7 },
  facts: { flexDirection: "row", gap: 8, marginTop: 14 },
  fact: { backgroundColor: colors.soft, borderColor: colors.border, borderRadius: 6, borderWidth: 1, flexGrow: 1, padding: 10 },
  factLabel: { color: colors.muted, fontSize: 6.5, marginBottom: 4, textTransform: "uppercase" },
  factValue: { fontSize: 10, fontWeight: 700 },
  section: { marginTop: 22 },
  sectionTitle: { borderBottomColor: colors.accent, borderBottomWidth: 1.5, fontFamily: "Times-Roman", fontSize: 17, marginBottom: 12, paddingBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { borderColor: colors.border, borderRadius: 5, borderWidth: 1, minHeight: 44, padding: 9, width: "48.8%" },
  cellLabel: { color: colors.muted, fontSize: 6.5, marginBottom: 4, textTransform: "uppercase" },
  cellValue: { fontSize: 9.5, fontWeight: 700 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { backgroundColor: colors.pale, borderRadius: 12, color: "#70401e", fontSize: 7, paddingHorizontal: 9, paddingVertical: 5 },
  comparable: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 },
  comparableLeft: { width: "62%" },
  comparableRight: { textAlign: "right", width: "35%" },
  comparableTitle: { fontSize: 9, fontWeight: 700, marginBottom: 3 },
  small: { color: colors.muted, fontSize: 7, lineHeight: 1.35 },
  callout: { backgroundColor: colors.pale, borderLeftColor: colors.accent, borderLeftWidth: 3, marginTop: 16, padding: 13 },
  calloutTitle: { fontSize: 10, fontWeight: 700, marginBottom: 5 },
  paragraph: { color: "#4f4a45", fontSize: 8.5, lineHeight: 1.55, marginBottom: 8 },
  agent: { alignItems: "center", borderColor: colors.border, borderRadius: 6, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 18, padding: 13 },
  agentName: { fontSize: 10, fontWeight: 700, marginBottom: 3 },
  footer: { bottom: 18, color: colors.muted, fontSize: 6, left: 38, position: "absolute", right: 38, textAlign: "center" },
  pageNumber: { bottom: 18, color: colors.muted, fontSize: 6, position: "absolute", right: 38 },
  chartGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  chart: { borderColor: colors.border, borderRadius: 6, borderWidth: 1, padding: 12, width: "48.5%" },
  chartTitle: { fontFamily: "Times-Roman", fontSize: 12, marginBottom: 10 },
  barRow: { marginBottom: 7 },
  barLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  barLabel: { color: colors.muted, fontSize: 6.5 },
  barValue: { fontSize: 6.5, fontWeight: 700 },
  barTrack: { backgroundColor: "#eee7df", borderRadius: 3, height: 5, overflow: "hidden" },
  barFill: { backgroundColor: colors.accent, borderRadius: 3, height: 5 },
  sourceNote: { borderTopColor: colors.border, borderTopWidth: 1, color: colors.muted, fontSize: 6.5, lineHeight: 1.4, marginTop: 18, paddingTop: 8 },
});

type Agent = { email?: string | null; full_name?: string | null } | null;

export async function renderEstimationPdf(estimation: AdminEstimation, agent: Agent, options: { inseeProfile?: InseeHousingProfile | null; reportVersion?: number } = {}) {
  const logo = await readFile(path.join(process.cwd(), "public/brand/les-jumelles-logo-noir.png"));
  return renderToBuffer(<EstimationPdfDocument agent={agent} estimation={estimation} inseeProfile={options.inseeProfile} logo={logo} reportVersion={options.reportVersion} />);
}

export function estimationPdfFileName(estimation: Pick<AdminEstimation, "address_label" | "id">) {
  const address = slugify(estimation.address_label).slice(0, 70);
  return `estimation-${address || estimation.id.slice(0, 8)}.pdf`;
}

function EstimationPdfDocument({ agent, estimation, inseeProfile, logo, reportVersion }: { agent: Agent; estimation: AdminEstimation; inseeProfile?: InseeHousingProfile | null; logo: Buffer; reportVersion?: number }) {
  const input = estimation.input_payload;
  const result = estimation.result_payload;
  const features = featureLabels(input);
  const generatedWasAdjusted = Boolean(estimation.range_adjusted);
  const date = formatDate(estimation.updated_at || estimation.created_at);

  return <Document author="Les Jumelles Immo" subject={`Estimation immobilière - ${estimation.address_label}`} title={`Estimation - ${estimation.address_label}`}>
    <Page size="A4" style={styles.page}>
      <View style={styles.coverTop}>
        <Image src={logo} style={styles.logo} />
        <Text style={styles.eyebrow}>Estimation immobilière personnalisée</Text>
        <Text style={styles.title}>{estimation.address_label}</Text>
        <Text style={styles.subtitle}>{propertyLabel(estimation.property_type)} - {formatNumber(estimation.surface_m2)} m² - {estimation.rooms} pièces</Text>
      </View>

      <View style={styles.valuation}>
        <Text style={styles.valuationLabel}>{generatedWasAdjusted ? "Fourchette validée par votre conseillère" : "Fourchette estimative"}</Text>
        <View style={styles.range}>
          <Text style={styles.rangePrice}>{formatCurrency(estimation.low_price)}</Text>
          <Text style={styles.rangeDash}>-</Text>
          <Text style={styles.rangePrice}>{formatCurrency(estimation.high_price)}</Text>
        </View>
        <View style={styles.central}>
          <Text style={styles.centralPrice}>{formatCurrency(estimation.median_price)}</Text>
          <Text style={styles.centralCaption}>Valeur centrale conseillée - {formatNumber(estimation.price_per_m2)} €/m²</Text>
        </View>
      </View>

      <View style={styles.facts}>
        <Fact label="Confiance des données" value={`${estimation.confidence_score ?? 0}/5`} />
        <Fact label="Ventes comparables" value={String(result.comparables.length)} />
        <Fact label="Évolution sur 12 mois" value={percent(result.market?.priceEvolution12Months)} />
        <Fact label="Délai de vente local" value={result.market?.saleDurationDays ? `${result.market.saleDurationDays} jours` : "NC"} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Présentation du bien</Text>
        <View style={styles.grid}>
          <Cell label="Type" value={propertyLabel(estimation.property_type)} />
          <Cell label="Surface habitable" value={`${formatNumber(estimation.surface_m2)} m²`} />
          <Cell label="Nombre de pièces" value={String(estimation.rooms)} />
          <Cell label="État déclaré" value={conditionLabel(input.condition)} />
          <Cell label="Terrain" value={input.landAreaM2 !== undefined ? `${formatNumber(input.landAreaM2)} m²` : "Non applicable"} />
          <Cell label="Construction" value={input.constructionYear ? String(input.constructionYear) : "Non renseignée"} />
          <Cell label="Salles de bain" value={input.bathrooms !== undefined ? String(input.bathrooms) : "Non renseigné"} />
          <Cell label="DPE" value={input.dpe ?? "Non renseigné"} />
        </View>
        {features.length ? <View style={styles.tags}>{features.map((feature) => <Text key={feature} style={styles.tag}>{feature}</Text>)}</View> : null}
      </View>

      <View style={styles.agent}>
        <View><Text style={styles.agentName}>{agent?.full_name || "Les Jumelles Immo"}</Text><Text style={styles.small}>{agent?.email || "contact@lesjumelles.immo"}</Text></View>
        <View><Text style={[styles.small, { textAlign: "right" }]}>Étude mise à jour le {date}</Text><Text style={[styles.small, { textAlign: "right" }]}>Réf. {estimation.id.slice(0, 8).toUpperCase()}{reportVersion ? ` · Version ${reportVersion}` : ""}</Text></View>
      </View>
      <Footer />
    </Page>

    {inseeProfile ? <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Portrait résidentiel INSEE</Text>
      <Text style={styles.title}>Le parc immobilier à {inseeProfile.cityName}</Text>
      <Text style={styles.subtitle}>{formatNumber(inseeProfile.totalHousing)} logements recensés · millésime {inseeProfile.vintage}</Text>
      <View style={styles.chartGrid}>
        <DistributionChart items={inseeProfile.housingTypes} title="Maisons et appartements" />
        <DistributionChart items={inseeProfile.occupancy} title="Occupation du parc" />
        <DistributionChart items={inseeProfile.tenure} title="Statut des occupants" />
        <DistributionChart items={inseeProfile.rooms} title="Nombre de pièces" />
        <DistributionChart items={inseeProfile.surfaces} title="Surface des résidences principales" />
        <DistributionChart items={inseeProfile.construction} title="Période de construction" />
      </View>
      <View style={styles.callout} wrap={false}>
        <Text style={styles.calloutTitle}>Comment lire ces graphiques ?</Text>
        <Text style={styles.paragraph}>Ces données décrivent la structure du parc de logements de la commune. Elles apportent un contexte objectif à l’étude, sans remplacer les ventes comparables ni l’analyse du micro-secteur de l’adresse.</Text>
      </View>
      <Text style={styles.sourceNote}>Source : INSEE, Recensement de la population {inseeProfile.vintage}, base infracommunale Logement. Profil communal {inseeProfile.cityName} ({inseeProfile.inseeCode}). Données intégrées au rapport lors de sa génération.</Text>
      <Footer />
    </Page> : null}

    <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Analyse du marché</Text>
      <Text style={styles.title}>Les données qui situent votre bien</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repères locaux</Text>
        <View style={styles.grid}>
          <Cell label="Prix moyen du secteur" value={result.market?.sectorPricePerM2 ? `${formatNumber(result.market.sectorPricePerM2)} €/m²` : "Non disponible"} />
          <Cell label="Prix estimé du bien" value={`${formatNumber(estimation.price_per_m2)} €/m²`} />
          <Cell label="Évolution sur 12 mois" value={percent(result.market?.priceEvolution12Months)} />
          <Cell label="Délai de vente observé" value={result.market?.saleDurationDays ? `${result.market.saleDurationDays} jours` : "Non disponible"} />
          <Cell label="Niveau de demande" value={result.market?.demandLevel ?? "Non disponible"} />
          <Cell label="Niveau d’offre" value={result.market?.supplyLevel ?? "Non disponible"} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions comparables</Text>
        {result.comparables.length ? result.comparables.slice(0, 10).map((sale) => <View key={sale.id} style={styles.comparable} wrap={false}>
          <View style={styles.comparableLeft}><Text style={styles.comparableTitle}>{sale.label}</Text><Text style={styles.small}>{sale.surfaceM2 ? `${formatNumber(sale.surfaceM2)} m²` : "Surface NC"} - {sale.rooms ? `${sale.rooms} pièces` : "Pièces NC"} - {sale.distanceMeters !== undefined ? formatDistance(sale.distanceMeters) : "Distance NC"}</Text></View>
          <View style={styles.comparableRight}><Text style={styles.comparableTitle}>{formatCurrency(sale.price)}</Text><Text style={styles.small}>{sale.pricePerM2 ? `${formatNumber(sale.pricePerM2)} €/m²` : "Prix/m² NC"} - {sale.soldAt ? monthYear(sale.soldAt) : "Date NC"}</Text></View>
        </View>) : <Text style={styles.paragraph}>Aucune transaction comparable exploitable n’a été retournée pour cette adresse.</Text>}
      </View>

      <View style={styles.callout} wrap={false}>
        <Text style={styles.calloutTitle}>Lecture des données</Text>
        <Text style={styles.paragraph}>La valeur proposée rapproche les caractéristiques déclarées du bien, les prix du secteur et les ventes comparables disponibles. Les bases immobilières donnent un repère objectif ; la visite permet ensuite d’intégrer les qualités propres au logement.</Text>
      </View>
      <Footer />
    </Page>

    <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Expertise Les Jumelles Immo</Text>
      <Text style={styles.title}>Ce qu’une visite permet d’affiner</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Les critères au-delà des bases de données</Text>
        <View style={styles.grid}>
          <Cell label="Micro-emplacement" value="Rue, calme, accès et environnement immédiat" />
          <Cell label="Vue et luminosité" value="Orientation, perspectives et lumière naturelle" />
          <Cell label="État réel" value="Qualité des travaux, matériaux et entretien" />
          <Cell label="Distribution" value="Volumes, circulation et fonctionnalité des espaces" />
          <Cell label="Extérieurs" value="Terrasse, jardin, intimité et potentiel d’usage" />
          <Cell label="Urbanisme" value="Extension, division et règles applicables" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Méthodologie et portée de l’estimation</Text>
        <Text style={styles.paragraph}>Cette étude est construite à partir des informations déclarées lors de la saisie, des données de marché disponibles au jour du calcul et, lorsque cela est possible, de transactions comparables localisées à proximité.</Text>
        <Text style={styles.paragraph}>La fourchette basse et la fourchette haute matérialisent l’incertitude liée aux caractéristiques qui ne peuvent pas être entièrement mesurées à distance. La valeur centrale constitue un repère de positionnement, et non une garantie de prix ou de délai de vente.</Text>
        <Text style={styles.paragraph}>Une visite du bien, l’analyse des documents juridiques et techniques ainsi que la définition d’une stratégie de commercialisation restent nécessaires avant la mise en vente.</Text>
      </View>

      <View style={styles.callout} wrap={false}>
        <Text style={styles.calloutTitle}>Votre interlocuteur</Text>
        <Text style={styles.paragraph}>{agent?.full_name || "Les Jumelles Immo"}{agent?.email ? ` - ${agent.email}` : " - contact@lesjumelles.immo"}</Text>
        <Text style={styles.paragraph}>Les Jumelles Immo réunit transaction immobilière, estimation, urbanisme et architecture intérieure pour révéler et défendre la valeur de votre bien.</Text>
      </View>
      <Footer />
    </Page>
  </Document>;
}

function Fact({ label, value }: { label: string; value: string }) { return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text></View>; }
function Cell({ label, value }: { label: string; value: string }) { return <View style={styles.cell}><Text style={styles.cellLabel}>{label}</Text><Text style={styles.cellValue}>{value}</Text></View>; }
function DistributionChart({ items, title }: { items: InseeDistributionItem[]; title: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return <View style={styles.chart} wrap={false}><Text style={styles.chartTitle}>{title}</Text>{items.map((item) => {
    const percentage = total ? item.value / total * 100 : 0;
    return <View key={item.label} style={styles.barRow}><View style={styles.barLabels}><Text style={styles.barLabel}>{item.label}</Text><Text style={styles.barValue}>{percentage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(1, percentage)}%` }]} /></View></View>;
  })}</View>;
}
function Footer() { return <><Text style={styles.footer} fixed>Les Jumelles Immo - Agence Séverine Masfrand - Document d’estimation non contractuel</Text><Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} style={styles.pageNumber} fixed /></>; }
function propertyLabel(value: string) { return value === "house" ? "Maison" : "Appartement"; }
function conditionLabel(value?: string) { return ({ new: "Excellent état", good: "Bon état", refresh: "À rafraîchir", renovate: "À rénover" } as Record<string, string>)[value ?? ""] ?? "Non renseigné"; }
function featureLabels(input: AdminEstimation["input_payload"]) { const labels: string[] = []; if (input.hasOutdoorSpace) labels.push("Extérieur"); if (input.hasParking) labels.push("Parking / garage"); if (input.hasCellar) labels.push("Cave"); if (input.hasNiceView) labels.push("Belle vue"); if (input.hasElevator) labels.push("Ascenseur"); if (input.hasPool) labels.push("Piscine"); if (input.floor !== undefined) labels.push(`Étage ${input.floor}`); return labels; }
function percent(value?: number) { return value === undefined ? "Non disponible" : `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR")} %`; }
function formatCurrency(value: number) { return `${formatNumber(Math.round(value))} €`; }
function formatNumber(value: number) { return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value)); }
function monthYear(value: string) { return new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(new Date(value)); }
function formatDistance(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km` : `${formatNumber(value)} m`; }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

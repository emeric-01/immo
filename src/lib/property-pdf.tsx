/* eslint-disable jsx-a11y/alt-text -- React PDF images are not DOM img elements. */
import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import sharp from "sharp";
import type { Property } from "@/lib/properties";
import { getSiteUrl } from "@/lib/site";

const ink = "#171717";
const muted = "#687080";
const line = "#ded9d2";
const accent = "#a56a40";
const soft = "#fbf6ea";

type PdfImageSource = {
  data: Buffer;
  format: "jpg" | "png";
};

type PropertyPdfOptions = {
  siteOrigin?: string;
};

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", color: ink, fontFamily: "Helvetica", fontSize: 8, paddingBottom: 66 },
  top: { flexDirection: "row", height: 252 },
  identityPanel: { backgroundColor: "#ffffff", width: "38%" },
  identity: { alignItems: "center", flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 16 },
  logo: { height: 58, marginBottom: 15, objectFit: "contain", width: 142 },
  reference: { color: muted, fontSize: 5.8, letterSpacing: 1.1, marginBottom: 9, textTransform: "uppercase" },
  listingType: { color: accent, fontSize: 6.5, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5, textTransform: "uppercase" },
  listingTitle: { fontFamily: "Times-Roman", fontSize: 15.5, lineHeight: 1.08, marginBottom: 13, textAlign: "center" },
  city: { fontSize: 10.5, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" },
  address: { color: "#4e4e4e", fontSize: 7.4, lineHeight: 1.2, textAlign: "center" },
  contact: { alignItems: "center", backgroundColor: soft, flexDirection: "row", height: 75, paddingHorizontal: 12 },
  contactPortrait: { borderRadius: 24, height: 48, marginRight: 10, objectFit: "cover", width: 48 },
  contactInfo: { flexGrow: 1, maxWidth: 118 },
  contactName: { fontSize: 8.5, fontWeight: 700, marginBottom: 5, textTransform: "uppercase" },
  contactLine: { fontSize: 6.8, lineHeight: 1.4 },
  qr: { height: 38, marginLeft: 7, width: 38 },
  hero: { height: "100%", position: "relative", width: "62%" },
  heroImage: { height: "100%", objectFit: "cover", width: "100%" },
  priceBox: { backgroundColor: "#ffffff", bottom: 22, paddingHorizontal: 14, paddingVertical: 8, position: "absolute", right: 0 },
  price: { fontSize: 18, fontWeight: 700 },
  gallery: { flexDirection: "row", gap: 4, height: 153, paddingTop: 4 },
  galleryImage: { flexGrow: 1, height: "100%", objectFit: "cover" },
  content: { flexDirection: "row", gap: 13, paddingHorizontal: 10, paddingTop: 9 },
  detailsColumn: { width: "36%" },
  descriptionColumn: { width: "64%" },
  sectionHeader: { backgroundColor: soft, fontSize: 9.5, fontWeight: 700, paddingHorizontal: 8, paddingVertical: 6, textTransform: "uppercase" },
  sectionBody: { paddingHorizontal: 8, paddingTop: 7 },
  detailRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 5.5 },
  detailLabel: { color: "#565656", fontSize: 7.8, marginRight: 4 },
  detailValue: { fontSize: 7.8, fontWeight: 700 },
  feature: { color: "#4f4f4f", fontSize: 7.7, lineHeight: 1.38, marginBottom: 3 },
  descriptionLead: { fontFamily: "Times-Roman", fontSize: 11.5, lineHeight: 1.12, marginBottom: 7 },
  description: { color: "#4e4e4e", fontSize: 7.8, lineHeight: 1.47 },
  energy: { marginTop: 12 },
  energyRow: { alignItems: "center", flexDirection: "row", marginTop: 8 },
  energyLabel: { color: "#4e4e4e", fontSize: 7.4, width: 76 },
  energyScale: { alignItems: "center", flexDirection: "row", gap: 2 },
  energyLetter: { color: "#ffffff", fontSize: 6.8, fontWeight: 700, height: 15, paddingTop: 3, textAlign: "center", width: 20 },
  energyLetterActive: { borderColor: "#ffffff", borderRadius: 3, borderWidth: 1.5, fontSize: 8.5, height: 23, paddingTop: 5, width: 27 },
  energyMissing: { color: muted, fontSize: 7, fontStyle: "italic" },
  footer: { bottom: 13, color: "#555555", left: 26, position: "absolute", right: 26, textAlign: "center" },
  legal: { fontSize: 5.1, lineHeight: 1.35 },
  footerLink: { color: accent, fontSize: 5.5, marginTop: 4 },
});

const energyColors: Record<string, string> = {
  A: "#168a54",
  B: "#5aa64a",
  C: "#a6be3c",
  D: "#e4c53b",
  E: "#e89838",
  F: "#d45b37",
  G: "#aa3435",
};


export async function renderPropertyPdf(property: Property, options: PropertyPdfOptions = {}) {
  const siteOrigin = normalizeSiteOrigin(options.siteOrigin || getSiteUrl());
  const propertyUrl = siteUrl(`/biens/${property.slug}`, siteOrigin);
  const [logo, contactPortrait, images, qrCode] = await Promise.all([
    loadLocalImage("public/brand/les-jumelles-logo-noir.png", { width: 500 }, siteOrigin),
    loadLocalImage(contactPortraitPath(property.contact_name), { height: 240, width: 240 }, siteOrigin),
    loadPropertyImages(property, siteOrigin),
    QRCode.toBuffer(propertyUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      type: "png",
      width: 220,
    }).then((data) => ({ data, format: "png" as const })),
  ]);

  return renderToBuffer(
    <PropertyPdfDocument contactPortrait={contactPortrait} images={images} logo={logo} property={property} propertyUrl={propertyUrl} qrCode={qrCode} />,
  );
}

export function propertyPdfFileName(property: Pick<Property, "city_name" | "slug">) {
  const city = slugify(property.city_name);
  const slug = slugify(property.slug);
  return `fiche-bien-${city || slug || "les-jumelles-immo"}.pdf`;
}

function PropertyPdfDocument({
  contactPortrait,
  images,
  logo,
  property,
  propertyUrl,
  qrCode,
}: {
  contactPortrait: PdfImageSource;
  images: PdfImageSource[];
  logo: PdfImageSource;
  property: Property;
  propertyUrl: string;
  qrCode: PdfImageSource;
}) {
  const description = truncate(stripHtml(property.description || property.short_description || ""), 900);
  const propertyType = propertyTypeLabel(property.property_type);
  const address = property.address || [property.postal_code, property.neighborhood].filter(Boolean).join(" · ");
  const surfaceFacts = propertySurfaceFacts(property);
  const characteristicFacts = propertyCharacteristicFacts(property);
  const features = propertyFeatures(property);
  const rating = property.energy_rating?.toUpperCase() || "";

  return (
    <Document author="Les Jumelles Immo" subject={`Fiche du bien ${property.title}`} title={property.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.top} wrap={false}>
          <View style={styles.identityPanel}>
            <View style={styles.identity}>
              <Image src={logo} style={styles.logo} />
              <Text style={styles.reference}>Réf. {property.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.listingType}>{propertyType} à vendre</Text>
              <Text style={styles.listingTitle}>{property.title}</Text>
              <Text style={styles.city}>{property.city_name}</Text>
              {address ? <Text style={styles.address}>{address}</Text> : null}
            </View>
            <View style={styles.contact}>
              <Image src={contactPortrait} style={styles.contactPortrait} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{property.contact_name || "Les Jumelles Immo"}</Text>
                {property.contact_phone ? <Text style={styles.contactLine}>Tél. {property.contact_phone}</Text> : null}
                <Text style={styles.contactLine}>{property.contact_email || "contact@lesjumelles.immo"}</Text>
              </View>
              <Link src={propertyUrl}><Image src={qrCode} style={styles.qr} /></Link>
            </View>
          </View>
          <View style={styles.hero}>
            <Image src={images[0]} style={styles.heroImage} />
            <View style={styles.priceBox}>
              <Text style={styles.price}>{formatCurrency(property.price)} F.A.I</Text>
            </View>
          </View>
        </View>

        <PropertyGallery images={images} />

        <View style={styles.content} wrap={false}>
          <View style={styles.detailsColumn}>
            {surfaceFacts.length ? <>
              <Text style={styles.sectionHeader}>Surfaces</Text>
              <View style={styles.sectionBody}>
                {surfaceFacts.map(([label, value]) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label} :</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </> : null}

            <Text style={[styles.sectionHeader, { marginTop: 5 }]}>Caractéristiques</Text>
            <View style={styles.sectionBody}>
              {characteristicFacts.map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label} :</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
              {features.map((feature) => <Text key={feature} style={styles.feature}>• {feature}</Text>)}
            </View>
          </View>

          <View style={styles.descriptionColumn}>
            <Text style={styles.sectionHeader}>Description du bien</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.descriptionLead}>{property.short_description || "Un bien sélectionné par Les Jumelles Immo"}</Text>
              <Text style={styles.description}>{description || "Contactez notre équipe pour découvrir ce bien et organiser une visite."}</Text>
              <View style={styles.energy}>
                <Text style={styles.sectionHeader}>Performance énergétique</Text>
                <EnergyScale rating={rating} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.legal}>Les Jumelles Immo - Agence Séverine Masfrand, SAS immatriculée au RCS de Marseille sous le n° 829 076 611, siège social 595 route des Aubes, 13400 Aubagne.</Text>
          <Text style={styles.legal}>Carte professionnelle n° CPI 1310 2021 000 000 132. Prix : {formatCurrency(property.price)}. Honoraires à la charge du {property.fees_paid_by?.toLowerCase() || "vendeur"}. Document non contractuel.</Text>
          <Text style={styles.footerLink}>Retrouvez cette annonce sur {new URL(propertyUrl).host}</Text>
        </View>
      </Page>
    </Document>
  );
}

function PropertyGallery({ images }: { images: PdfImageSource[] }) {
  const gallery = images.slice(1, 4);
  if (!gallery.length) return null;
  return <View style={styles.gallery} wrap={false}>{gallery.map((image, index) => (
    <Image key={index} src={image} style={[styles.galleryImage, { width: `${100 / gallery.length}%` }]} />
  ))}</View>;
}

function EnergyScale({ rating }: { rating: string }) {
  return <View style={styles.energyRow}>
    <Text style={styles.energyLabel}>Classe énergie</Text>
    {rating ? <View style={styles.energyScale}>{Object.keys(energyColors).map((letter) => (
      <Text key={letter} style={[styles.energyLetter, rating === letter ? styles.energyLetterActive : {}, { backgroundColor: energyColors[letter] }]}>{letter}</Text>
    ))}</View> : <Text style={styles.energyMissing}>DPE non renseigné</Text>}
  </View>;
}

async function loadPropertyImages(property: Property, siteOrigin: string) {
  const candidates = property.images.slice(0, 4).map((image) => image.public_url);
  const loaded = await Promise.all(candidates.map((url) => loadRemoteImage(url).catch(() => null)));
  const images = loaded.filter((image): image is PdfImageSource => Boolean(image));

  if (images.length) {
    return images;
  }

  return [await loadLocalImage("public/images/agence-jumelles-immo-hero.webp", { height: 900, width: 1400 }, siteOrigin)];
}

async function loadRemoteImage(url: string, resize: { height?: number; width?: number } = { height: 900, width: 1400 }) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Image inaccessible (${response.status})`);
  return imageBufferToDataUri(Buffer.from(await response.arrayBuffer()), resize);
}

async function loadLocalImage(relativePath: string, resize: { height?: number; width?: number }, siteOrigin: string) {
  try {
    const buffer = await readFile(path.join(process.cwd(), relativePath));
    return imageBufferToDataUri(buffer, resize);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const publicPath = `/${relativePath.replace(/^public\//, "")}`;
    return loadRemoteImage(siteUrl(publicPath, siteOrigin), resize);
  }
}

async function imageBufferToDataUri(buffer: Buffer, resize: { height?: number; width?: number }): Promise<PdfImageSource> {
  const output = await sharp(buffer)
    .rotate()
    .resize({ ...resize, fit: "cover", position: "attention", withoutEnlargement: true })
    .jpeg({ progressive: false, quality: 80 })
    .toBuffer();
  return { data: output, format: "jpg" };
}

function propertySurfaceFacts(property: Property): [string, string][] {
  const facts: [string, string][] = [];
  if (property.surface_m2) facts.push(["Surface habitable", `${formatNumber(property.surface_m2)} m²`]);
  if (property.land_area_m2) facts.push(["Terrain", `${formatNumber(property.land_area_m2)} m²`]);
  if (property.terrace_m2) facts.push(["Terrasse", `${formatNumber(property.terrace_m2)} m²`]);
  return facts;
}

function propertyCharacteristicFacts(property: Property): [string, string][] {
  const facts: [string, string][] = [];
  if (property.rooms) facts.push(["Pièces", String(property.rooms)]);
  if (property.bedrooms) facts.push(["Chambres", String(property.bedrooms)]);
  if (property.bathrooms) facts.push(["Salles d’eau", String(property.bathrooms)]);
  if (property.levels) facts.push(["Niveaux", String(property.levels)]);
  if (property.floor_label) facts.push(["Étage", property.floor_label]);
  if (property.exposure) facts.push(["Exposition", property.exposure]);
  if (property.construction_year) facts.push(["Construction", String(property.construction_year)]);
  if (property.property_condition) facts.push(["État", property.property_condition]);
  if (property.kitchen_type) facts.push(["Cuisine", property.kitchen_type]);
  if (property.parking_spaces) facts.push(["Stationnement", `${property.parking_spaces} place${property.parking_spaces > 1 ? "s" : ""}`]);
  return facts.slice(0, 8);
}

function propertyFeatures(property: Property) {
  const features = [...property.amenities];
  if (property.parking_details && !features.some((feature) => /parking|garage|box/i.test(feature))) features.push(property.parking_details);
  if (property.heating && !features.some((feature) => /chauffage|climatisation/i.test(feature))) features.push(property.heating);
  if (!features.length) features.push("Bien sélectionné", "Visite sur rendez-vous");
  return features.slice(0, 6);
}

function contactPortraitPath(contactName: string | null) {
  const normalized = contactName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
  if (normalized.includes("emeric")) return "public/images/emeric-legros.png";
  if (normalized.includes("laure")) return "public/images/laure-masfrand-jumelles-immo.webp";
  if (normalized.includes("severine")) return "public/images/severine-masfrand-jumelles-immo.webp";
  return "public/images/laure-severine-jumelles-immo.jpg";
}

function propertyTypeLabel(value: string) {
  if (value === "house") return "Maison";
  if (value === "apartment") return "Appartement";
  if (value === "land") return "Terrain";
  return "Bien";
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;
}

function formatCurrency(value: number) {
  return `${groupDigits(Math.round(value).toString())} €`;
}

function formatNumber(value: number) {
  const [integer, decimal] = value.toFixed(1).replace(/\.0$/, "").split(".");
  return `${groupDigits(integer)}${decimal ? `,${decimal}` : ""}`;
}

function groupDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function normalizeSiteOrigin(value: string) {
  return new URL(value).origin;
}

function siteUrl(pathname: string, siteOrigin: string) {
  return new URL(pathname, `${siteOrigin}/`).toString();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

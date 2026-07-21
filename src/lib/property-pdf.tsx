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
import { absoluteUrl } from "@/lib/site";

const ink = "#171717";
const muted = "#687080";
const line = "#ded9d2";
const accent = "#a56a40";
const soft = "#f8f2ec";

type PdfImageSource = {
  data: Buffer;
  format: "jpg" | "png";
};

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", color: ink, fontFamily: "Helvetica", fontSize: 8 },
  header: { alignItems: "center", borderBottomColor: line, borderBottomWidth: 1, flexDirection: "row", height: 58, justifyContent: "space-between", paddingHorizontal: 28 },
  logo: { height: 42, objectFit: "contain", width: 120 },
  reference: { color: muted, fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase" },
  photoGrid: { backgroundColor: "#ffffff", flexDirection: "row", gap: 4, height: 242, padding: 4 },
  mainPhoto: { height: "100%", objectFit: "cover", width: "66%" },
  mainPhotoOnly: { height: "100%", objectFit: "cover", width: "100%" },
  sidePhotos: { flexDirection: "column", gap: 4, height: "100%", width: "34%" },
  sidePhoto: { flexGrow: 1, height: "50%", objectFit: "cover", width: "100%" },
  sidePhotoSingle: { height: "100%", objectFit: "cover", width: "100%" },
  body: { paddingBottom: 48, paddingHorizontal: 28, paddingTop: 17 },
  titleRow: { alignItems: "flex-end", borderBottomColor: line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingBottom: 13 },
  titleBlock: { maxWidth: "70%" },
  eyebrow: { color: accent, fontSize: 6.5, fontWeight: 700, letterSpacing: 1.3, textTransform: "uppercase" },
  title: { fontFamily: "Times-Roman", fontSize: 22, lineHeight: 1.04, marginBottom: 3, marginTop: 5 },
  location: { color: muted, fontSize: 8 },
  price: { fontFamily: "Times-Bold", fontSize: 22 },
  content: { flexDirection: "row", gap: 20, marginTop: 15 },
  descriptionColumn: { width: "54%" },
  sectionTitle: { fontFamily: "Times-Roman", fontSize: 14, lineHeight: 1.08, marginBottom: 7, marginTop: 4 },
  description: { color: "#4e535b", fontSize: 7.4, lineHeight: 1.45 },
  facts: { borderLeftColor: line, borderLeftWidth: 1, borderTopColor: line, borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", width: "46%" },
  fact: { borderBottomColor: line, borderBottomWidth: 1, borderRightColor: line, borderRightWidth: 1, minHeight: 39, padding: 7, width: "50%" },
  factLabel: { color: muted, fontSize: 6 },
  factValue: { fontSize: 7.5, fontWeight: 700, marginTop: 4 },
  lower: { borderTopColor: line, borderTopWidth: 1, flexDirection: "row", gap: 16, marginTop: 15, paddingTop: 13 },
  features: { width: "39%" },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 7 },
  feature: { alignItems: "center", borderColor: line, borderWidth: 1, flexDirection: "row", minHeight: 22, paddingHorizontal: 6, width: "48%" },
  featureDot: { alignItems: "center", backgroundColor: ink, borderRadius: 5, color: "#ffffff", fontSize: 6, height: 10, justifyContent: "center", marginRight: 5, width: 10 },
  featureText: { fontSize: 6.3 },
  energy: { width: "23%" },
  energyRows: { marginTop: 5 },
  energyRow: { alignItems: "center", flexDirection: "row", gap: 5, marginBottom: 2 },
  energyLetter: { alignItems: "center", color: "#ffffff", fontSize: 5.5, height: 10, justifyContent: "center", width: 12 },
  energyBar: { height: 5 },
  energyBarActive: { height: 8 },
  contact: { backgroundColor: soft, padding: 10, width: "38%" },
  contactName: { fontFamily: "Times-Roman", fontSize: 13, lineHeight: 1.05, marginBottom: 5, marginTop: 4 },
  contactCopy: { color: "#675448", fontSize: 6.2, lineHeight: 1.35 },
  contactDetails: { fontSize: 6.5, fontWeight: 700, marginTop: 6 },
  contactEmail: { color: "#675448", fontSize: 5.8, marginTop: 3 },
  qr: { height: 37, marginTop: 7, width: 37 },
  legal: { borderTopColor: line, borderTopWidth: 1, color: "#8a8a8a", fontSize: 4.8, lineHeight: 1.35, marginTop: 11, paddingTop: 7 },
  footer: { bottom: 14, color: muted, flexDirection: "row", fontSize: 5.5, justifyContent: "space-between", left: 28, position: "absolute", right: 28 },
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

const energyWidths: Record<string, number> = { A: 22, B: 31, C: 40, D: 49, E: 58, F: 67, G: 76 };

export async function renderPropertyPdf(property: Property) {
  const [logo, images, qrCode] = await Promise.all([
    loadLocalImage("public/brand/les-jumelles-logo-noir.png", { width: 500 }),
    loadPropertyImages(property),
    QRCode.toBuffer(absoluteUrl(`/biens/${property.slug}`), {
      errorCorrectionLevel: "M",
      margin: 0,
      type: "png",
      width: 220,
    }).then((data) => ({ data, format: "png" as const })),
  ]);

  return renderToBuffer(
    <PropertyPdfDocument images={images} logo={logo} property={property} qrCode={qrCode} />,
  );
}

export function propertyPdfFileName(property: Pick<Property, "city_name" | "slug">) {
  const city = slugify(property.city_name);
  const slug = slugify(property.slug);
  return `fiche-bien-${city || slug || "les-jumelles-immo"}.pdf`;
}

function PropertyPdfDocument({
  images,
  logo,
  property,
  qrCode,
}: {
  images: PdfImageSource[];
  logo: PdfImageSource;
  property: Property;
  qrCode: PdfImageSource;
}) {
  const description = truncate(stripHtml(property.description || property.short_description || ""), 560);
  const propertyType = propertyTypeLabel(property.property_type);
  const location = [property.city_name, property.postal_code ? `(${property.postal_code})` : null, property.neighborhood].filter(Boolean).join(" · ");
  const facts = propertyFacts(property);
  const features = propertyFeatures(property);
  const rating = property.energy_rating?.toUpperCase() || "";

  return (
    <Document author="Les Jumelles Immo" subject={`Fiche du bien ${property.title}`} title={property.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <Text style={styles.reference}>Réf. {property.id.slice(0, 8).toUpperCase()} · Fiche bien</Text>
        </View>

        <PropertyPhotos images={images} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>{propertyType} à vendre</Text>
              <Text style={styles.title}>{property.title}</Text>
              <Text style={styles.location}>{location}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(property.price)}</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.descriptionColumn}>
              <Text style={styles.eyebrow}>Le bien</Text>
              <Text style={styles.sectionTitle}>{property.short_description || "Un bien sélectionné par Les Jumelles Immo"}</Text>
              <Text style={styles.description}>{description || "Contactez notre équipe pour découvrir ce bien et organiser une visite."}</Text>
            </View>
            <View style={styles.facts}>
              {facts.map(([label, value]) => (
                <View key={label} style={styles.fact}>
                  <Text style={styles.factLabel}>{label}</Text>
                  <Text style={styles.factValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.lower}>
            <View style={styles.features}>
              <Text style={styles.eyebrow}>Prestations</Text>
              <Text style={styles.sectionTitle}>Les atouts du bien</Text>
              <View style={styles.featureGrid}>
                {features.map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <Text style={styles.featureDot}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.energy}>
              <Text style={styles.eyebrow}>Énergie</Text>
              <Text style={styles.sectionTitle}>{rating ? `DPE · ${rating}` : "DPE non renseigné"}</Text>
              {rating ? (
                <View style={styles.energyRows}>
                  {Object.keys(energyColors).map((letter) => (
                    <View key={letter} style={styles.energyRow}>
                      <Text style={[styles.energyLetter, { backgroundColor: energyColors[letter] }]}>{letter}</Text>
                      <View style={[rating === letter ? styles.energyBarActive : styles.energyBar, { backgroundColor: energyColors[letter], opacity: rating === letter ? 1 : 0.4, width: energyWidths[letter] }]} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.contact}>
              <Text style={styles.eyebrow}>Contact</Text>
              <Text style={styles.contactName}>{property.contact_name || "Les Jumelles Immo"}</Text>
              <Text style={styles.contactCopy}>Notre équipe vous accompagne pour répondre à vos questions et organiser une visite.</Text>
              {property.contact_phone ? <Text style={styles.contactDetails}>{property.contact_phone}</Text> : null}
              <Text style={styles.contactEmail}>{property.contact_email || "contact@lesjumelles.immo"}</Text>
              <Link src={absoluteUrl(`/biens/${property.slug}`)}><Image src={qrCode} style={styles.qr} /></Link>
            </View>
          </View>

          <Text style={styles.legal}>
            Prix de vente : {formatCurrency(property.price)}. Honoraires à la charge du {property.fees_paid_by?.toLowerCase() || "vendeur"}. Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques. Document non contractuel.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>lesjumellesimmo.fr</Text>
          <Text>Transaction · Estimation · Recherche</Text>
        </View>
      </Page>
    </Document>
  );
}

function PropertyPhotos({ images }: { images: PdfImageSource[] }) {
  if (images.length < 2) {
    return <View style={styles.photoGrid}><Image src={images[0]} style={styles.mainPhotoOnly} /></View>;
  }

  return (
    <View style={styles.photoGrid}>
      <Image src={images[0]} style={styles.mainPhoto} />
      <View style={styles.sidePhotos}>
        <Image src={images[1]} style={images.length > 2 ? styles.sidePhoto : styles.sidePhotoSingle} />
        {images[2] ? <Image src={images[2]} style={styles.sidePhoto} /> : null}
      </View>
    </View>
  );
}

async function loadPropertyImages(property: Property) {
  const candidates = property.images.slice(0, 3).map((image) => image.public_url);
  const loaded = await Promise.all(candidates.map((url) => loadRemoteImage(url).catch(() => null)));
  const images = loaded.filter((image): image is PdfImageSource => Boolean(image));

  if (images.length) {
    return images;
  }

  return [await loadLocalImage("public/images/agence-jumelles-immo-hero.webp", { height: 900, width: 1400 })];
}

async function loadRemoteImage(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Image inaccessible (${response.status})`);
  return imageBufferToDataUri(Buffer.from(await response.arrayBuffer()), { height: 900, width: 1400 });
}

async function loadLocalImage(relativePath: string, resize: { height?: number; width?: number }) {
  const buffer = await readFile(path.join(process.cwd(), relativePath));
  return imageBufferToDataUri(buffer, resize);
}

async function imageBufferToDataUri(buffer: Buffer, resize: { height?: number; width?: number }): Promise<PdfImageSource> {
  const output = await sharp(buffer)
    .rotate()
    .resize({ ...resize, fit: "cover", position: "attention", withoutEnlargement: true })
    .jpeg({ progressive: false, quality: 80 })
    .toBuffer();
  return { data: output, format: "jpg" };
}

function propertyFacts(property: Property): [string, string][] {
  const facts: [string, string][] = [];
  if (property.surface_m2) facts.push(["Surface habitable", `${formatNumber(property.surface_m2)} m²`]);
  if (property.land_area_m2) facts.push(["Terrain", `${formatNumber(property.land_area_m2)} m²`]);
  if (property.rooms) facts.push(["Pièces", String(property.rooms)]);
  if (property.bedrooms) facts.push(["Chambres", String(property.bedrooms)]);
  if (property.bathrooms) facts.push(["Salles d’eau", String(property.bathrooms)]);
  if (property.exposure) facts.push(["Exposition", property.exposure]);
  if (property.floor_label && facts.length < 6) facts.push(["Étage", property.floor_label]);
  if (property.construction_year && facts.length < 6) facts.push(["Construction", String(property.construction_year)]);
  return facts.slice(0, 6);
}

function propertyFeatures(property: Property) {
  const features = [...property.amenities];
  if (property.terrace_m2 && !features.some((feature) => /terrasse/i.test(feature))) features.push(`Terrasse ${formatNumber(property.terrace_m2)} m²`);
  if (property.parking_details && !features.some((feature) => /parking|garage|box/i.test(feature))) features.push(property.parking_details);
  if (property.heating && !features.some((feature) => /chauffage|climatisation/i.test(feature))) features.push(property.heating);
  if (!features.length) features.push("Bien sélectionné", "Visite sur rendez-vous");
  return features.slice(0, 6);
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
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

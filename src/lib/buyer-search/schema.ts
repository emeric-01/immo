import { z } from "zod";

const nullablePositiveNumber = z.number().finite().positive().max(100_000_000).nullable();
const preferenceValues = z.array(z.string().trim().min(1).max(80)).max(20);

export const buyerSearchSchema = z
  .object({
    location: z.object({
      cities: z.array(
        z.object({
          name: z.string().trim().min(1).max(120),
          postalCode: z.string().trim().max(12).optional(),
          postalCodes: z.array(z.string().trim().max(12)).max(20).optional(),
          cityCode: z.string().trim().max(12).optional(),
          latitude: z.number().finite().min(-90).max(90).optional(),
          longitude: z.number().finite().min(-180).max(180).optional(),
          radiusKm: z.number().finite().positive().max(100).optional(),
        }),
      ).max(10),
      radiusKm: z.number().finite().positive().max(100).nullable().optional(),
      customRadius: z.number().finite().positive().max(100).nullable().optional(),
    }),
    property: z.object({
      type: z.enum(["house", "apartment", "indifferent"]).nullable().optional(),
      types: z.array(z.enum(["house", "apartment"])).max(2).optional(),
      idealBudget: nullablePositiveNumber,
      maximumBudget: nullablePositiveNumber,
    }),
    characteristics: z.object({
      minimumLivingArea: z.number().finite().positive().max(100_000).nullable(),
      minimumRooms: z.number().finite().min(0).max(100).nullable(),
      minimumBedrooms: z.number().finite().min(0).max(100).nullable(),
      minimumBathrooms: z.number().finite().min(0).max(100).nullable(),
    }),
    preferences: z.object({
      parking: preferenceValues,
      outdoor: preferenceValues,
      buildingComfort: preferenceValues,
      additionalSpaces: preferenceValues,
      houseEquipment: preferenceValues,
      works: preferenceValues,
      environment: preferenceValues,
      minimumLandArea: z.number().finite().positive().max(10_000_000).nullable().optional(),
      maximumFloor: z.number().finite().min(0).max(300).nullable().optional(),
    }),
    project: z.object({
      purchaseTimeline: z.string().trim().max(80).nullable(),
      financingStatus: z.string().trim().max(80).nullable(),
      currentSituation: z.string().trim().max(80).nullable(),
    }),
    priorities: z.array(
      z.object({
        key: z.string().trim().min(1).max(80),
        label: z.string().trim().min(1).max(120),
        value: z.string().trim().min(1).max(120),
        category: z.string().trim().min(1).max(120),
        level: z.enum(["essential", "desired"]),
      }),
    ).max(50),
    contact: z.object({
      firstName: z.string().trim().max(80),
      lastName: z.string().trim().max(80),
      email: z.string().trim().max(180),
      phone: z.string().trim().max(30),
      preferredChannels: z.array(z.enum(["email", "sms", "phone"])).max(3).default([]),
      preferredChannel: z.enum(["email", "sms", "phone"]).nullish().default(null),
      consent: z.boolean(),
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.property.idealBudget !== null &&
      data.property.maximumBudget !== null &&
      data.property.maximumBudget < data.property.idealBudget
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Le budget maximum doit etre superieur ou egal au budget ideal.",
        path: ["property", "maximumBudget"],
      });
    }
  });

export const stepSchemas = {
  location: buyerSearchSchema.shape.location.superRefine((location, ctx) => {
    if (location.cities.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Ajoutez au moins une ville ou un secteur.",
        path: ["cities"],
      });
    }
    location.cities.forEach((city, index) => {
      if (!city.radiusKm || city.radiusKm <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Choisissez un rayon de recherche pour chaque ville.",
          path: ["cities", index, "radiusKm"],
        });
      }
    });
  }),
  property: buyerSearchSchema.shape.property.superRefine((property, ctx) => {
    const selectedTypes = property.types?.length
      ? property.types
      : property.type === "house" || property.type === "apartment"
        ? [property.type]
        : [];

    if (selectedTypes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Choisissez au moins un type de bien.",
        path: ["types"],
      });
    }
    if (property.idealBudget === null || property.idealBudget <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Renseignez un budget ideal positif.",
        path: ["idealBudget"],
      });
    }
    if (property.maximumBudget === null || property.maximumBudget <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Renseignez un budget maximum positif.",
        path: ["maximumBudget"],
      });
    }
    if (
      property.idealBudget !== null &&
      property.maximumBudget !== null &&
      property.maximumBudget < property.idealBudget
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Le budget maximum doit etre superieur ou egal au budget ideal.",
        path: ["maximumBudget"],
      });
    }
  }),
  characteristics: buyerSearchSchema.shape.characteristics.superRefine(
    (characteristics, ctx) => {
      if (!characteristics.minimumLivingArea || characteristics.minimumLivingArea <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Renseignez une surface habitable minimale.",
          path: ["minimumLivingArea"],
        });
      }
    },
  ),
  preferences: buyerSearchSchema.shape.preferences,
  project: buyerSearchSchema.shape.project.superRefine((project, ctx) => {
    if (!project.purchaseTimeline) {
      ctx.addIssue({ code: "custom", message: "Choisissez un delai.", path: ["purchaseTimeline"] });
    }
    if (!project.financingStatus) {
      ctx.addIssue({ code: "custom", message: "Choisissez un statut de financement.", path: ["financingStatus"] });
    }
    if (!project.currentSituation) {
      ctx.addIssue({ code: "custom", message: "Choisissez votre situation actuelle.", path: ["currentSituation"] });
    }
  }),
  priorities: buyerSearchSchema.shape.priorities,
  contact: buyerSearchSchema.shape.contact.superRefine((contact, ctx) => {
    if (contact.firstName.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Le prenom est obligatoire.", path: ["firstName"] });
    }
    if (contact.lastName.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Le nom est obligatoire.", path: ["lastName"] });
    }
    if (!z.email().safeParse(contact.email).success) {
      ctx.addIssue({ code: "custom", message: "Renseignez un email valide.", path: ["email"] });
    }
    if (!/^(?:(?:\+33|0)\s?)[1-9](?:[\s.-]?\d{2}){4}$/.test(contact.phone.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "Renseignez un telephone francais valide.",
        path: ["phone"],
      });
    }
    if (contact.preferredChannels.length === 0 && !contact.preferredChannel) {
      ctx.addIssue({
        code: "custom",
        message: "Choisissez au moins un moyen pour etre prevenu.",
        path: ["preferredChannels"],
      });
    }
    if (!contact.consent) {
      ctx.addIssue({
        code: "custom",
        message: "Le consentement est obligatoire pour enregistrer la recherche.",
        path: ["consent"],
      });
    }
  }),
};

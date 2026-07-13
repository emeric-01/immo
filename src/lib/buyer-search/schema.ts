import { z } from "zod";

const nullablePositiveNumber = z.number().positive().nullable();
const nullableNonNegativeNumber = z.number().min(0).nullable();

export const buyerSearchSchema = z
  .object({
    location: z.object({
      cities: z.array(
        z.object({
          name: z.string().min(1),
          postalCode: z.string().optional(),
          postalCodes: z.array(z.string()).optional(),
          cityCode: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          radiusKm: z.number().positive().optional(),
        }),
      ),
      radiusKm: nullablePositiveNumber.optional(),
      customRadius: nullablePositiveNumber.optional(),
    }),
    property: z.object({
      type: z.enum(["house", "apartment", "indifferent"]).nullable(),
      idealBudget: nullablePositiveNumber,
      maximumBudget: nullablePositiveNumber,
    }),
    characteristics: z.object({
      minimumLivingArea: nullablePositiveNumber,
      minimumRooms: z.number().min(1).nullable(),
      minimumBedrooms: nullableNonNegativeNumber,
      minimumBathrooms: nullableNonNegativeNumber,
    }),
    preferences: z.object({
      parking: z.array(z.string()),
      outdoor: z.array(z.string()),
      buildingComfort: z.array(z.string()),
      additionalSpaces: z.array(z.string()),
      houseEquipment: z.array(z.string()),
      works: z.array(z.string()),
      environment: z.array(z.string()),
      minimumLandArea: nullablePositiveNumber.optional(),
      maximumFloor: nullableNonNegativeNumber.optional(),
    }),
    project: z.object({
      purchaseTimeline: z.string().nullable(),
      financingStatus: z.string().nullable(),
      currentSituation: z.string().nullable(),
    }),
    priorities: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.string(),
        category: z.string(),
        level: z.enum(["essential", "desired"]),
      }),
    ),
    contact: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      phone: z.string(),
      preferredChannel: z.enum(["email", "sms", "phone"]).nullable(),
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
    if (!property.type) {
      ctx.addIssue({
        code: "custom",
        message: "Choisissez un type de bien.",
        path: ["type"],
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
      if (!characteristics.minimumRooms || characteristics.minimumRooms < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Renseignez au moins une piece.",
          path: ["minimumRooms"],
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
    if (!contact.preferredChannel) {
      ctx.addIssue({
        code: "custom",
        message: "Choisissez un canal de contact privilegie.",
        path: ["preferredChannel"],
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

export type PropertyType = "house" | "apartment" | "indifferent";
export type PreferredChannel = "email" | "sms" | "phone";
export type PriorityLevel = "essential" | "desired";

export type BuyerSearchFormData = {
  location: {
    cities: Array<{
      name: string;
      postalCode?: string;
      postalCodes?: string[];
      cityCode?: string;
      latitude?: number;
      longitude?: number;
      radiusKm?: number;
    }>;
    radiusKm?: number | null;
    customRadius?: number | null;
  };
  property: {
    type: PropertyType | null;
    idealBudget: number | null;
    maximumBudget: number | null;
  };
  characteristics: {
    minimumLivingArea: number | null;
    minimumRooms: number | null;
    minimumBedrooms: number | null;
    minimumBathrooms: number | null;
  };
  preferences: {
    parking: string[];
    outdoor: string[];
    buildingComfort: string[];
    additionalSpaces: string[];
    houseEquipment: string[];
    works: string[];
    environment: string[];
    minimumLandArea?: number | null;
    maximumFloor?: number | null;
  };
  project: {
    purchaseTimeline: string | null;
    financingStatus: string | null;
    currentSituation: string | null;
  };
  priorities: Array<{
    key: string;
    label: string;
    value: string;
    category: string;
    level: PriorityLevel;
  }>;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredChannel: PreferredChannel | null;
    consent: boolean;
  };
};

export type WizardStepId =
  | "location"
  | "property"
  | "characteristics"
  | "preferences"
  | "project"
  | "summary"
  | "priorities"
  | "contact";

export type BuyerSearchCity = BuyerSearchFormData["location"]["cities"][number];

export const buyerSearchSteps: Array<{ id: WizardStepId; label: string }> = [
  { id: "location", label: "Localisation" },
  { id: "property", label: "Bien recherche" },
  { id: "characteristics", label: "Caracteristiques" },
  { id: "preferences", label: "Preferences & equipements" },
  { id: "project", label: "Votre projet" },
  { id: "summary", label: "Recapitulatif" },
  { id: "priorities", label: "Indispensable ou souhaite" },
  { id: "contact", label: "Coordonnees" },
];

export const defaultBuyerSearchData: BuyerSearchFormData = {
  location: {
    cities: [
      { name: "Aubagne", postalCode: "13400", latitude: 43.2928, longitude: 5.5707, radiusKm: 2 },
      { name: "Gemenos", postalCode: "13420", latitude: 43.2975, longitude: 5.6286, radiusKm: 2 },
    ],
    radiusKm: 2,
    customRadius: null,
  },
  property: {
    type: "house",
    idealBudget: 330000,
    maximumBudget: 350000,
  },
  characteristics: {
    minimumLivingArea: 90,
    minimumRooms: 4,
    minimumBedrooms: 3,
    minimumBathrooms: 1,
  },
  preferences: {
    parking: ["garage"],
    outdoor: ["garden", "terrace"],
    buildingComfort: [],
    additionalSpaces: [],
    houseEquipment: ["pool"],
    works: ["light_works"],
    environment: ["calm", "shops"],
    minimumLandArea: null,
    maximumFloor: null,
  },
  project: {
    purchaseTimeline: "m3_6",
    financingStatus: "budget_defined",
    currentSituation: "tenant",
  },
  priorities: [],
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredChannel: "email",
    consent: false,
  },
};

export type PropertyType = "house" | "apartment";
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
    type?: PropertyType | "indifferent" | null;
    types?: PropertyType[];
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
  { id: "property", label: "Bien & criteres" },
  { id: "preferences", label: "Preferences & equipements" },
  { id: "project", label: "Votre projet" },
  { id: "summary", label: "Recapitulatif" },
  { id: "priorities", label: "Indispensable ou souhaite" },
  { id: "contact", label: "Coordonnees" },
];

export const defaultBuyerSearchData: BuyerSearchFormData = {
  location: {
    cities: [],
    radiusKm: null,
    customRadius: null,
  },
  property: {
    type: null,
    types: [],
    idealBudget: null,
    maximumBudget: null,
  },
  characteristics: {
    minimumLivingArea: null,
    minimumRooms: 0,
    minimumBedrooms: 0,
    minimumBathrooms: 0,
  },
  preferences: {
    parking: [],
    outdoor: [],
    buildingComfort: [],
    additionalSpaces: [],
    houseEquipment: [],
    works: [],
    environment: [],
    minimumLandArea: null,
    maximumFloor: null,
  },
  project: {
    purchaseTimeline: null,
    financingStatus: null,
    currentSituation: null,
  },
  priorities: [],
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredChannel: null,
    consent: false,
  },
};

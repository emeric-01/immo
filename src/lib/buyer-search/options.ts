import type { BuyerSearchCity, PropertyType } from "./types";

export type BuyerSearchOption = {
  key: string;
  label: string;
  helper?: string;
  category: string;
};

export const citySuggestions: BuyerSearchCity[] = [
  { name: "Aubagne", postalCode: "13400", latitude: 43.2928, longitude: 5.5707 },
  { name: "Gemenos", postalCode: "13420", latitude: 43.2975, longitude: 5.6286 },
  {
    name: "La Penne-sur-Huveaune",
    postalCode: "13821",
    latitude: 43.2812,
    longitude: 5.5164,
  },
  { name: "Auriol", postalCode: "13390", latitude: 43.3711, longitude: 5.6344 },
  { name: "Roquevaire", postalCode: "13360", latitude: 43.3507, longitude: 5.6041 },
  { name: "Marseille", postalCode: "13000", latitude: 43.2965, longitude: 5.3698 },
  { name: "Aix-en-Provence", postalCode: "13100", latitude: 43.5297, longitude: 5.4474 },
  { name: "La Ciotat", postalCode: "13600", latitude: 43.1748, longitude: 5.6043 },
];

export const radiusOptions = [1, 2, 5, 10, 20] as const;

export const propertyTypeLabels: Record<PropertyType, string> = {
  house: "Maison",
  apartment: "Appartement",
  indifferent: "Indifferent",
};

export const parkingApartmentOptions: BuyerSearchOption[] = [
  { key: "no_parking", label: "Aucun besoin", category: "Stationnement" },
  { key: "outdoor_parking", label: "Parking exterieur", category: "Stationnement" },
  { key: "garage_box", label: "Garage / Box", category: "Stationnement" },
  { key: "multiple_spaces", label: "Plusieurs places", category: "Stationnement" },
];

export const parkingHouseOptions: BuyerSearchOption[] = [
  { key: "no_parking", label: "Aucun besoin", category: "Stationnement" },
  { key: "outdoor_parking", label: "Parking exterieur", category: "Stationnement" },
  { key: "garage", label: "Garage", category: "Stationnement" },
  { key: "multiple_spaces", label: "Plusieurs places", category: "Stationnement" },
];

export const outdoorApartmentOptions: BuyerSearchOption[] = [
  { key: "no_outdoor", label: "Aucun exterieur", category: "Exterieur" },
  { key: "balcony", label: "Balcon", category: "Exterieur" },
  { key: "terrace", label: "Terrasse", category: "Exterieur" },
  { key: "loggia", label: "Loggia", category: "Exterieur" },
];

export const outdoorHouseOptions: BuyerSearchOption[] = [
  { key: "no_outdoor", label: "Aucun exterieur", category: "Exterieur et terrain" },
  { key: "garden", label: "Jardin", category: "Exterieur et terrain" },
  { key: "terrace", label: "Terrasse", category: "Exterieur et terrain" },
  { key: "minimum_land_area", label: "Surface de terrain minimum", category: "Exterieur et terrain" },
];

export const buildingComfortOptions: BuyerSearchOption[] = [
  { key: "elevator", label: "Ascenseur", category: "Confort de l'immeuble" },
  { key: "maximum_floor", label: "Etage maximum souhaite", category: "Confort de l'immeuble" },
  { key: "top_floor", label: "Dernier etage", category: "Confort de l'immeuble" },
  { key: "secure_residence", label: "Residence securisee", category: "Confort de l'immeuble" },
  { key: "concierge", label: "Gardien / Concierge", category: "Confort de l'immeuble" },
];

export const additionalSpaceOptions: BuyerSearchOption[] = [
  { key: "cellar", label: "Cave", category: "Espaces complementaires" },
  { key: "attic", label: "Grenier", category: "Espaces complementaires" },
  { key: "bike_room", label: "Local velo", category: "Espaces complementaires" },
  { key: "no_extra_space", label: "Aucun besoin", category: "Espaces complementaires" },
];

export const houseEquipmentOptions: BuyerSearchOption[] = [
  { key: "pool", label: "Piscine", category: "Equipements maison" },
  { key: "single_storey", label: "Plain-pied", category: "Equipements maison" },
  { key: "outbuilding", label: "Dependance / Bureau", category: "Equipements maison" },
  { key: "fireplace", label: "Cheminee", category: "Equipements maison" },
];

export const worksOptions: BuyerSearchOption[] = [
  { key: "no_works", label: "Aucun travaux", category: "Travaux" },
  { key: "light_works", label: "Travaux legers acceptes", category: "Travaux" },
  { key: "major_works", label: "Travaux importants acceptes", category: "Travaux" },
  { key: "full_renovation", label: "Renovation complete", category: "Travaux" },
];

export const environmentOptions: BuyerSearchOption[] = [
  { key: "calm", label: "Calme", helper: "Environnement calme ou residentiel", category: "Environnement" },
  { key: "shops", label: "Proximite commerces", helper: "Commerces du quotidien proches", category: "Environnement" },
  { key: "schools", label: "Proximite ecoles", category: "Environnement" },
  { key: "transports", label: "Proximite transports", category: "Environnement" },
];

export const purchaseTimelineOptions: BuyerSearchOption[] = [
  { key: "asap", label: "Des que possible", category: "Quand souhaitez-vous acheter ?" },
  { key: "lt_3m", label: "Moins de 3 mois", category: "Quand souhaitez-vous acheter ?" },
  { key: "m3_6", label: "3 a 6 mois", category: "Quand souhaitez-vous acheter ?" },
  { key: "m6_12", label: "6 a 12 mois", category: "Quand souhaitez-vous acheter ?" },
  { key: "later", label: "Plus tard", category: "Quand souhaitez-vous acheter ?" },
];

export const financingOptions: BuyerSearchOption[] = [
  { key: "cash", label: "Achat comptant", category: "Ou en est votre financement ?" },
  { key: "preapproval", label: "Accord de principe obtenu", category: "Ou en est votre financement ?" },
  { key: "budget_defined", label: "Budget defini", category: "Ou en est votre financement ?" },
  { key: "bank_meeting", label: "Rendez-vous bancaire prevu", category: "Ou en est votre financement ?" },
  { key: "to_study", label: "A etudier", category: "Ou en est votre financement ?" },
];

export const situationOptions: BuyerSearchOption[] = [
  { key: "tenant", label: "Locataire", category: "Quelle est votre situation actuelle ?" },
  { key: "owner_no_sale", label: "Proprietaire sans bien a vendre", category: "Quelle est votre situation actuelle ?" },
  { key: "owner_to_sell", label: "Proprietaire avec un bien a vendre", category: "Quelle est votre situation actuelle ?" },
  { key: "listed", label: "Bien deja en vente", category: "Quelle est votre situation actuelle ?" },
  { key: "under_offer", label: "Compromis deja signe", category: "Quelle est votre situation actuelle ?" },
];

export const preferredChannelOptions: BuyerSearchOption[] = [
  { key: "email", label: "Par email", helper: "Recommande", category: "Contact privilegie" },
  { key: "sms", label: "Par SMS", helper: "Rapide et pratique", category: "Contact privilegie" },
  { key: "phone", label: "Par telephone", helper: "Echange direct", category: "Contact privilegie" },
];

export function optionLabel(options: BuyerSearchOption[], key?: string | null) {
  return options.find((option) => option.key === key)?.label ?? "";
}

export function getPreferenceOptions(propertyType: PropertyType | null) {
  const isApartment = propertyType === "apartment";
  const isHouse = propertyType === "house";

  return {
    parking: isApartment ? parkingApartmentOptions : parkingHouseOptions,
    outdoor: isApartment ? outdoorApartmentOptions : outdoorHouseOptions,
    buildingComfort: isHouse ? [] : buildingComfortOptions,
    additionalSpaces: isHouse ? [] : additionalSpaceOptions,
    houseEquipment: isApartment ? [] : houseEquipmentOptions,
    works: worksOptions,
    environment: environmentOptions,
  };
}

export function allPreferenceOptions(propertyType: PropertyType | null) {
  const groups = getPreferenceOptions(propertyType);
  return [
    ...groups.parking,
    ...groups.outdoor,
    ...groups.buildingComfort,
    ...groups.additionalSpaces,
    ...groups.houseEquipment,
    ...groups.works,
    ...groups.environment,
  ];
}

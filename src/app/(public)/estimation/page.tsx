import type { Metadata } from "next";
import { EstimationForm } from "@/app/estimation-form";
import type { AddressSuggestion } from "@/lib/immo-data";
import type { RealtyType } from "@/lib/immo-data";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Estimation immobilière | Les Jumelles Immo", description: "Obtenez une estimation immobilière argumentée à partir de votre adresse, des caractéristiques du bien et des ventes locales.", path: "/estimation" });

type EstimationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function EstimationPage({ searchParams }: EstimationPageProps) {
  const params = await searchParams;
  const address = getParam(params.address);
  const latitude = Number(getParam(params.latitude));
  const longitude = Number(getParam(params.longitude));
  const initialAddress: AddressSuggestion | undefined =
    address && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? {
          label: address,
          latitude,
          longitude,
          addressId: getParam(params.addressId),
          inseeCode: getParam(params.inseeCode),
          departmentCode: getParam(params.departmentCode),
          cityName: getParam(params.cityName),
          postCode: getParam(params.postCode) ? [getParam(params.postCode)!] : undefined,
        }
      : undefined;

  const propertyType = getParam(params.propertyType);
  const initialPropertyType: RealtyType | undefined =
    propertyType === "house" || propertyType === "apartment" ? propertyType : undefined;
  const initialSurfaceM2 = Number(getParam(params.surfaceM2));
  const initialRooms = Number(getParam(params.rooms));

  return (
    <EstimationForm
      initialAddress={initialAddress}
      initialPropertyType={initialPropertyType}
      initialRooms={Number.isFinite(initialRooms) ? initialRooms : undefined}
      initialSurfaceM2={Number.isFinite(initialSurfaceM2) ? initialSurfaceM2 : undefined}
    />
  );
}

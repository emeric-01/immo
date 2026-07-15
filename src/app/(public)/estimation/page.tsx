import type { Metadata } from "next";
import { EstimationForm } from "@/app/estimation-form";
import type { AddressSuggestion } from "@/lib/immo-data";

export const metadata: Metadata = {
  title: "Estimation immobilière | Les Jumelles Immo",
  description: "Estimez votre bien immobilier avec Les Jumelles Immo.",
};

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

  return <EstimationForm initialAddress={initialAddress} />;
}

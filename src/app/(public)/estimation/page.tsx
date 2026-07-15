import type { Metadata } from "next";
import { EstimationForm } from "@/app/estimation-form";

export const metadata: Metadata = {
  title: "Estimation immobilière | Les Jumelles Immo",
  description: "Estimez votre bien immobilier avec Les Jumelles Immo.",
};

export default function EstimationPage() {
  return <EstimationForm />;
}

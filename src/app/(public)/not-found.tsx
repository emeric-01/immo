import type { Metadata } from "next";
import { NotFoundContent } from "@/components/public-site/NotFoundContent";

export const metadata: Metadata = {
  title: "Page introuvable | Les Jumelles Immo",
  robots: { index: false, follow: true },
};

export default function PublicNotFound() {
  return <NotFoundContent/>;
}

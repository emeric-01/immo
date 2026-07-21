import type { Metadata } from "next";
import { NotFoundContent } from "@/components/public-site/NotFoundContent";
import { PublicFooter } from "@/components/public-site/PublicFooter";
import { PublicHeader } from "@/components/public-site/PublicHeader";
import publicStyles from "@/components/public-site/public-site.module.css";

export const metadata: Metadata = {
  title: "Page introuvable | Les Jumelles Immo",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return <div className={publicStyles.site}><PublicHeader/><div className={publicStyles.content}><NotFoundContent/></div><PublicFooter/></div>;
}

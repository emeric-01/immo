import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Immo Backoffice",
  description: "Backoffice local pour l'activite immo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

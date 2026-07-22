import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

const privateRoutes = [
  "/admin",
  "/client",
  "/api/",
  "/recherche-acheteurs",
  "/recherche/confirmation",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privateRoutes },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privateRoutes },
      { userAgent: "GPTBot", allow: "/", disallow: privateRoutes },
      { userAgent: "ChatGPT-User", allow: "/", disallow: privateRoutes },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}

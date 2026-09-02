import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { CONTENT_IMAGE_QUALITY } from "./src/lib/content/image-config";
import { legacyAgenceAsmRedirects } from "./src/lib/seo/agence-asm-redirects";
import { legacyWordPressRedirects } from "./src/lib/seo/legacy-redirects";

const pricePageSources = [
  "src/app/(public)/prix-immobilier/[city]",
  "src/app/(public)/prix-m2/[city]",
  "src/lib/cities.ts",
  "src/lib/city-market-data.ts",
  "src/lib/local-agency-neighborhoods.ts",
  "src/lib/market-nowcast.ts",
  "src/lib/published-city-market.ts",
];

function readGitDate(args: string[]) {
  try {
    const value = execFileSync("git", args, { encoding: "utf8" }).trim();
    if (!value || Number.isNaN(Date.parse(value))) return undefined;
    return new Date(value).toISOString();
  } catch {
    return undefined;
  }
}

// The scoped Git date changes only when a source used by city price pages changes.
// HEAD is a safe fallback for shallow deployment clones without enough file history.
const pricePageTemplateLastModified = readGitDate([
  "log",
  "-1",
  "--format=%cI",
  "--",
  ...pricePageSources,
]) ?? readGitDate(["show", "-s", "--format=%cI", "HEAD"]);

const nextConfig: NextConfig = {
  env: {
    ...(pricePageTemplateLastModified
      ? { SEO_PRICE_PAGE_TEMPLATE_LAST_MODIFIED: pricePageTemplateLastModified }
      : {}),
  },
  images: {
    qualities: [CONTENT_IMAGE_QUALITY, 78],
    remotePatterns: [
      { protocol: "https", hostname: "hhduybnbtkusieqesqwi.supabase.co", pathname: "/storage/v1/object/public/property-images/**" },
      { protocol: "https", hostname: "hhduybnbtkusieqesqwi.supabase.co", pathname: "/storage/v1/object/public/blog-images/**" },
      { protocol: "https", hostname: "**.staticlbi.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...legacyAgenceAsmRedirects,
      ...legacyWordPressRedirects,
      ...["marseille-11e", "marseille-12e"].flatMap((legacyCity) => [
        {
          source: `/prix-m2/${legacyCity}`,
          destination: "/prix-m2/marseille",
          permanent: true,
        },
        {
          source: `/prix-immobilier/${legacyCity}`,
          destination: "/prix-m2/marseille",
          permanent: true,
        },
        {
          source: `/agence-immobiliere/${legacyCity}`,
          destination: "/agence-immobiliere/marseille",
          permanent: true,
        },
        {
          source: `/estimation-immobiliere/${legacyCity}`,
          destination: "/estimation-immobiliere/marseille",
          permanent: true,
        },
      ]),
      {
        source: "/prix-immobilier/:city",
        destination: "/prix-m2/:city",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

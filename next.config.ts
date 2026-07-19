import type { NextConfig } from "next";
import { CONTENT_IMAGE_QUALITY } from "./src/lib/content/image-config";

const nextConfig: NextConfig = {
  images: {
    qualities: [CONTENT_IMAGE_QUALITY, 78],
    remotePatterns: [
      { protocol: "https", hostname: "hhduybnbtkusieqesqwi.supabase.co", pathname: "/storage/v1/object/public/property-images/**" },
      { protocol: "https", hostname: "hhduybnbtkusieqesqwi.supabase.co", pathname: "/storage/v1/object/public/blog-images/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/prix-immobilier/:city",
        destination: "/prix-m2/:city",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

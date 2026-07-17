import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [76, 78],
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

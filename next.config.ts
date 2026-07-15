import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

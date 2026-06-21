import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "stratoshealth.site",
        "*.stratoshealth.site",
        "*.coolify.selfhosted" // general development/test on Coolify
      ],
    },
  },
};

export default nextConfig;

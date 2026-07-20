import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vinext checks multipart route requests against this limit before the
      // analysis route applies its stricter 9 MB image budget.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

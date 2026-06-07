import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@better-auth/kysely-adapter": "./stubs/empty-kysely-adapter.mjs",
    },
  },
};

export default nextConfig;

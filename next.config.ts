import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  turbopack: {
    resolveAlias: {
      "@better-auth/kysely-adapter": "./stubs/empty-kysely-adapter.mjs",
    },
  },
};

export default nextConfig;

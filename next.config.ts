import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost", "192.168.0.13"],
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  turbopack: {
    resolveAlias: {
      "@better-auth/kysely-adapter": "./stubs/empty-kysely-adapter.mjs",
    },
  },
};

export default nextConfig;

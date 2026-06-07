import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-auth",
    "@better-auth/kysely-adapter",
    "kysely",
    "mongoose",
    "mongodb",
    "esbuild",
    "@react-email/render",
    "@react-email/components",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
  ],
};

export default nextConfig;

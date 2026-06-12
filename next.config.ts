import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "better-auth",
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

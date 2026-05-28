import type { NextConfig } from "next";

// Corporate proxy uses self-signed certs — bypass SSL verification in dev only
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  // pdf-parse reads test files at import time — keep it server-side only, out of the bundle
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;

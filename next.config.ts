import type { NextConfig } from "next";

// Corporate proxy uses self-signed certs — bypass SSL verification in dev only
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

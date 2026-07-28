import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Audio uploads are forwarded to the user's local Whisper service.
      // Keep this aligned with the 25 MB guard in /api/analyze.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;

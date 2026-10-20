import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [{ source: "/", destination: "/zh", permanent: false }];
  },
};

export default nextConfig;

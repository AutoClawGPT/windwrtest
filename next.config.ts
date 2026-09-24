import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@libsql/client"],
  transpilePackages: ["pixi.js", "pixi-live2d-display"],
};

export default nextConfig;

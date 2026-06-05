import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 明確指定 workspace root，避免 Turbopack 誤抓上層的 lockfile
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@beta-epic/ui"],
  webpack(config) {
    config.resolve.alias["@beta-epic/ui"] = path.resolve(
      __dirname,
      "../../packages/ui/src/index.ts",
    );
    return config;
  },
};

export default nextConfig;

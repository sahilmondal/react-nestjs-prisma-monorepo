import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui-core", "@workspace/auth-client"],
}

export default nextConfig

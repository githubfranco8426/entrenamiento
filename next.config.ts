import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/opengym/**": ["./vendor/opengym/coach/prompts/*.md"],
  },
};

export default nextConfig;

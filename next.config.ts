import type { NextConfig } from "next"

const isExport = process.env.NEXT_EXPORT === "true"
const isVercel = process.env.VERCEL === "1"

const nextConfig: NextConfig = {
  // Only set turbopack.root locally; Vercel manages its own via outputFileTracingRoot
  ...(!isVercel && {
    turbopack: {
      root: new URL(".", import.meta.url).pathname,
    },
  }),
  ...(isExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
  // If deploying to a project page (username.github.io/repo-name),
  // uncomment and set this to the repo name:
  // basePath: "/blog",
}

export default nextConfig

import type { NextConfig } from "next"

const isExport = process.env.NEXT_EXPORT === "true"

const nextConfig: NextConfig = {
  turbopack: {
    root: new URL(".", import.meta.url).pathname,
  },
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

import path from "node:path"
import type { NextConfig } from "next"

const isExport = process.env.NEXT_EXPORT === "true"

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
  // Monorepo hardening: pnpm links the @zlog/* workspace packages into
  // node_modules as symlinks. transpilePackages makes Turbopack compile
  // and watch their REAL paths (previously the watcher could silently
  // detach from them — changes to packages/database went unnoticed until
  // the dev server was restarted).
  transpilePackages: ["@zlog/database", "@zlog/core", "@zlog/auth"],
  // Pin the Turbopack root to the pnpm workspace root. The auto-detector
  // walks up for a lockfile and can pick a stray one above the repo
  // (e.g. ~/package-lock.json), setting a root that excludes
  // packages/* — which is what breaks @zlog/* resolution. An explicit
  // root must cover the workspace root (parent of apps/ and packages/),
  // NOT apps/web itself.
  turbopack: {
    // __dirname is apps/web; the workspace root is two levels up.
    root: path.join(__dirname, "../.."),
  },
  // If deploying to a project page (username.github.io/repo-name),
  // uncomment and set this to the repo name:
  // basePath: "/blog",
}

export default nextConfig

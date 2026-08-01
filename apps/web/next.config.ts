import type { NextConfig } from "next"

const isExport = process.env.NEXT_EXPORT === "true"

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
  // Monorepo hardening: pnpm links the @bitlog/* workspace packages into
  // node_modules as symlinks. transpilePackages makes Turbopack compile
  // and watch their REAL paths (previously the watcher could silently
  // detach from them — changes to packages/database went unnoticed until
  // the dev server was restarted).
  // NOTE: do NOT add turbopack.root here — with pnpm symlinks it breaks
  // module resolution entirely (Cannot find module '@bitlog/database' →
  // 500 on every page). Use `pnpm dev:watch` for packages/ changes.
  transpilePackages: ["@bitlog/database", "@bitlog/core", "@bitlog/auth"],
  // If deploying to a project page (username.github.io/repo-name),
  // uncomment and set this to the repo name:
  // basePath: "/blog",
}

export default nextConfig

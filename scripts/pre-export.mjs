// Pre-export script: adds force-static to API route files for static export
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiDir = join(__dirname, "..", "src", "app", "api")

const FORCE_STATIC = 'export const dynamic = "force-static"\n\n'

function findRouteFiles(dir) {
  const files = []
  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (entry === "route.ts") {
      files.push(fullPath)
    }
  }
  return files
}

const routeFiles = findRouteFiles(apiDir)

// Also include feed.xml and sitemap.xml routes
const extraRoutes = [
  join(__dirname, "..", "src", "app", "feed.xml", "route.ts"),
  join(__dirname, "..", "src", "app", "sitemap.xml", "route.ts"),
].filter(existsSync)

const allFiles = [...routeFiles, ...extraRoutes]

for (const file of allFiles) {
  let content = readFileSync(file, "utf-8")
  if (!content.startsWith(FORCE_STATIC.trim())) {
    writeFileSync(file, FORCE_STATIC + content, "utf-8")
    console.log(`Added force-static to: ${file}`)
  }
}

console.log("Pre-export complete.")

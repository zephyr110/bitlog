// Post-export script: removes force-static from API route files after export
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "fs"
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

const extraRoutes = [
  join(__dirname, "..", "src", "app", "feed.xml", "route.ts"),
  join(__dirname, "..", "src", "app", "sitemap.xml", "route.ts"),
].filter(existsSync)

const allFiles = [...routeFiles, ...extraRoutes]

for (const file of allFiles) {
  let content = readFileSync(file, "utf-8")
  if (content.startsWith(FORCE_STATIC.trim())) {
    const cleaned = content.slice(FORCE_STATIC.length)
    writeFileSync(file, cleaned, "utf-8")
    console.log(`Removed force-static from: ${file}`)
  }
}

console.log("Post-export complete.")

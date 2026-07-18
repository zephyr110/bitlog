import { readFileSync, writeFileSync } from "fs"

const authRoutes = [
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/me/route.ts",
  "src/app/api/auth/change-password/route.ts",
]

const HEADER = 'export const dynamic = "force-static"\n'

const action = process.argv[2] // "add" or "remove"

for (const file of authRoutes) {
  let content = readFileSync(file, "utf-8")
  if (action === "add" && !content.startsWith(HEADER)) {
    writeFileSync(file, HEADER + content)
    console.log(`Added force-static: ${file}`)
  } else if (action === "remove" && content.startsWith(HEADER)) {
    writeFileSync(file, content.slice(HEADER.length))
    console.log(`Removed force-static: ${file}`)
  }
}

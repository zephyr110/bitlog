import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api-auth"
import {
  verifyLogin,
  hashPassword,
  setPasswordHash,
  encodePasswordHash,
} from "@/lib/auth"
import fs from "fs"
import path from "path"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawBody = await request.json()
    const parseResult = changePasswordSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parseResult.data

    const verifiedUser = await verifyLogin(user.username, currentPassword)
    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    const newHash = await hashPassword(newPassword)

    // Update in-memory hash immediately so existing tokens are invalidated.
    setPasswordHash(newHash)

    // Persist to .env.local as a backup; still requires a restart to fully
    // replace process.env, but the in-memory value is now authoritative.
    // Base64-encode the hash to avoid $-expansion issues in .env files.
    const encodedHash = encodePasswordHash(newHash)
    const envPath = path.join(process.cwd(), ".env.local")
    let envContent = ""

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8")
      const updated = envContent.replace(
        /^\s*ADMIN_PASSWORD_HASH=.*$/m,
        () => `ADMIN_PASSWORD_HASH=${encodedHash}`
      )
      if (updated === envContent) {
        envContent =
          envContent.trimEnd() + `\nADMIN_PASSWORD_HASH=${encodedHash}\n`
      } else {
        envContent = updated
      }
    } else {
      envContent = `ADMIN_USERNAME=${user.username}\nADMIN_PASSWORD_HASH=${encodedHash}\n`
    }

    fs.writeFileSync(envPath, envContent, "utf-8")

    return NextResponse.json({ success: true, requireRelogin: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { verifyLogin, hashPassword } from "@/lib/auth"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const verifiedUser = await verifyLogin(user.username, currentPassword)
    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    const newHash = await hashPassword(newPassword)

    const envPath = path.join(process.cwd(), ".env.local")
    let envContent = ""

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8")
      // Match ADMIN_PASSWORD_HASH=... even with leading whitespace or trailing comments
      const updated = envContent.replace(
        /^\s*ADMIN_PASSWORD_HASH=.*$/m,
        `ADMIN_PASSWORD_HASH=${newHash}`
      )
      if (updated === envContent) {
        // Key not found — append it
        envContent = envContent.trimEnd() + `\nADMIN_PASSWORD_HASH=${newHash}\n`
      } else {
        envContent = updated
      }
    } else {
      envContent = `ADMIN_USERNAME=${user.username}\nADMIN_PASSWORD_HASH=${newHash}\n`
    }

    fs.writeFileSync(envPath, envContent, "utf-8")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

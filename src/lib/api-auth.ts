import { NextRequest } from "next/server"
import { verifyToken } from "@bitlog/auth"
import { type AuthUser } from "@bitlog/auth"

export async function requireAuth(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7)
  return verifyToken(token)
}

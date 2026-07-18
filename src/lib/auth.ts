import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { type AuthUser } from "@/types"

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "this-is-a-fallback-secret-at-least-32-chars-long!"
)

const JWT_EXPIRATION = "7d"

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const username = payload.username
    if (typeof username !== "string" || !username) return null
    return { username }
  } catch {
    return null
  }
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const adminUsername = process.env.ADMIN_USERNAME || "admin"
  const adminPasswordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    "$2b$10$MLZzZjQ57IqXxvOB2PPQzefbt6QxShFTEkKsOaTxIogartXw7ZhRW"

  if (username !== adminUsername) return null

  const isValid = await bcrypt.compare(password, adminPasswordHash)
  if (!isValid) return null

  return { username }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

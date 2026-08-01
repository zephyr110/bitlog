import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { getUserByUsername } from "@bitlog/database"
import { type AuthUser } from "./types"

const JWT_EXPIRATION = "7d"

function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required for authentication."
    )
  }
  return new TextEncoder().encode(secret)
}

/**
 * Resolve the password hash + version for a username from the database.
 * Returns null when the user does not exist or the database is unavailable.
 */
async function resolveCredential(
  username: string
): Promise<{ hash: string; version: string } | null> {
  const dbUser = await getUserByUsername(username)
  if (!dbUser) return null
  return { hash: dbUser.passwordHash, version: dbUser.passwordVersion }
}

export async function createToken(user: AuthUser): Promise<string> {
  const credential = await resolveCredential(user.username)
  const version = credential?.version ?? "none"
  return new SignJWT({ username: user.username, pv: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    const username = payload.username
    if (typeof username !== "string" || !username) return null

    const credential = await resolveCredential(username)
    if (!credential) return null

    const pv = payload.pv
    if (pv !== credential.version) return null

    return { username }
  } catch {
    return null
  }
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const credential = await resolveCredential(username)
  if (!credential) return null

  const isValid = await bcrypt.compare(password, credential.hash)
  if (!isValid) return null

  return { username }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

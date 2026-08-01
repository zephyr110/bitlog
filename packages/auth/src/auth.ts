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

function decodePasswordHash(hash: string | undefined): string | undefined {
  if (!hash) return undefined
  try {
    return Buffer.from(hash, "base64").toString("utf8")
  } catch {
    return hash
  }
}

/** Env-based fallback credentials (used when the database is unavailable). */
function getEnvCredential(): { username: string; hash: string; version: string } | null {
  const username = process.env.ADMIN_USERNAME
  const hash = decodePasswordHash(process.env.ADMIN_PASSWORD_HASH)
  if (!username || !hash) return null
  return { username, hash, version: hash.slice(0, 8) }
}

/**
 * Resolve the password hash + version for a username.
 * Prefers the database; falls back to env credentials (local dev / DB down).
 */
async function resolveCredential(
  username: string
): Promise<{ hash: string; version: string } | null> {
  const dbUser = await getUserByUsername(username)
  if (dbUser) {
    return { hash: dbUser.passwordHash, version: dbUser.passwordVersion }
  }
  const env = getEnvCredential()
  if (env && env.username === username) {
    return { hash: env.hash, version: env.version }
  }
  return null
}

export function encodePasswordHash(hash: string): string {
  return Buffer.from(hash).toString("base64")
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

import { randomInt } from "node:crypto"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { getUserByUsername } from "@bitlog/database"
import { type AuthUser } from "@bitlog/core"

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

// ── Recovery key ─────────────────────────────────────────────────────────

// No 0/O/1/I/L — unambiguous when transcribed by hand.
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Normalize a key for comparison: strip separators/whitespace, uppercase.
 *  The stored bcrypt hash covers the normalized form, so users may type
 *  the key in any case and with or without the dashes. */
export function normalizeRecoveryKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

/** Generate a one-time recovery key: 20 chars in 4 groups of 5, e.g.
 *  "4F8K9-W2P3X-7L6QD-MZQTN". Shown to the user exactly once; only its
 *  bcrypt hash is persisted. */
export function generateRecoveryKey(): string {
  const chars: string[] = []
  for (let i = 0; i < 20; i++) {
    chars.push(KEY_ALPHABET[randomInt(KEY_ALPHABET.length)])
  }
  const normalized = chars.join("")
  return `${normalized.slice(0, 5)}-${normalized.slice(5, 10)}-${normalized.slice(10, 15)}-${normalized.slice(15, 20)}`
}

/**
 * Verifies a recovery key for the user. Returns false when the user does
 * not exist, has no key set, or the key doesn't match — callers surface a
 * single generic error to avoid user enumeration.
 */
export async function verifyRecoveryKey(
  username: string,
  key: string
): Promise<boolean> {
  const dbUser = await getUserByUsername(username)
  if (!dbUser?.recoveryHash) return false
  return bcrypt.compare(normalizeRecoveryKey(key), dbUser.recoveryHash)
}

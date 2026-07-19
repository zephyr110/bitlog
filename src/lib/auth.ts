import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { type AuthUser } from "@/types"

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

let currentPasswordHash: string | undefined = decodePasswordHash(
  process.env.ADMIN_PASSWORD_HASH
)

export function getPasswordVersion(): string {
  return (currentPasswordHash || "").slice(0, 8)
}

export function encodePasswordHash(hash: string): string {
  return Buffer.from(hash).toString("base64")
}

export function setPasswordHash(hash: string): void {
  currentPasswordHash = hash
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ username: user.username, pv: getPasswordVersion() })
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

    const pv = payload.pv
    if (pv !== getPasswordVersion()) return null

    return { username }
  } catch {
    return null
  }
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPasswordHash =
    currentPasswordHash || decodePasswordHash(process.env.ADMIN_PASSWORD_HASH)

  if (!adminUsername || !adminPasswordHash) return null
  if (username !== adminUsername) return null

  const isValid = await bcrypt.compare(password, adminPasswordHash)
  if (!isValid) return null

  if (!currentPasswordHash) {
    currentPasswordHash = adminPasswordHash
  }

  return { username }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

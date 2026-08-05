import { createHash } from "node:crypto"

/** Client IP for rate limiting + session binding.
 *
 *  Order of preference:
 *  1. x-real-ip — set by common reverse proxies (Nginx) to the socket
 *     peer; a plain client cannot forge what a trusted proxy overwrites.
 *  2. x-forwarded-for first hop — on Vercel the platform overwrites this
 *     header and does not forward external IPs, so the first hop is the
 *     real client there.
 *
 *  A client POSTing raw XFF/XRIP headers at a server with no trusted
 *  proxy in front can still choose its own "IP" — that weakens the
 *  per-IP rate bucket (post/global buckets still hold) and is inherent
 *  to HTTP; the platform deployments this project targets (Vercel,
 *  Nginx-terminated) both neutralize it. */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  const fwd = request.headers.get("x-forwarded-for")
  const ip = fwd?.split(",")[0]?.trim()
  return ip || "unknown"
}

/** SHA-256 so the DB never stores a raw IP. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex")
}

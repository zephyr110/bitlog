import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSiteConfig } from "@/lib/get-site-config"
import { getClientIp, hashIp } from "@/lib/comment-ip"
import {
  verifyCommentSession,
  isBeforeMinSubmitDelay,
} from "@/lib/comment-session"
import {
  getCommentsByPost,
  createComment,
  consumeRateLimit,
  ipRateScope,
  postRateScope,
  GLOBAL_RATE_SCOPE,
  RATE_LIMIT_IP_WINDOW_MS,
  RATE_LIMIT_IP_MAX,
  RATE_LIMIT_POST_WINDOW_MS,
  RATE_LIMIT_POST_MAX,
  RATE_LIMIT_GLOBAL_WINDOW_MS,
  RATE_LIMIT_GLOBAL_MAX,
} from "@zlog/database"

// ── Public shape ────────────────────────────────────────────────────────
// The guest never sees author_email (stored, never rendered).

type PublicComment = {
  id: number
  postSlug: string
  authorName: string
  content: string
  createdAt: string
}

// ── Validation ──────────────────────────────────────────────────────────

const listQuery = z.object({
  post: z.string().min(1).max(100),
})

const createSchema = z.object({
  postSlug: z.string().min(1).max(100),
  // Optional — an empty/whitespace name becomes "Anonymous_<random>" at
  // insert (the trim transform already accepts "" and whitespace).
  authorName: z.string().trim().max(30).optional(),
  authorEmail: z.string().trim().max(100).optional().or(z.literal("")),
  content: z.string().trim().min(2).max(1000),
  // Signed session token from GET /api/comments/session.
  token: z.string().min(10).max(1000),
  // Token from the Turnstile widget (client-side) — optional only when
  // Turnstile is not configured on the server.
  turnstileToken: z.string().min(1).max(3000).optional(),
  // Honeypot — real visitors never see this field.
  website: z.string().max(500).optional(),
})

/** Anonymous fallback for nameless visitors — Anonymous_ + 8 random
 *  hex chars (collision odds are negligible at comment volume). */
function anonymousName(): string {
  return `Anonymous_${crypto.randomUUID().slice(0, 8)}`
}

/** Max 2 URLs per comment — link spam is the bulk of automated abuse.
 *  Counts http(s)://, www., and bare domains (example.com). */
function countUrls(content: string): number {
  return (
    content.match(/https?:\/\/|www\.|(?:\b[a-z0-9-]+\.(?:[a-z]{2,})\b)/gi) ||
    []
  ).length
}

/** A comment made of one repeated character/short loop (aaaa…, 66666…,
 *  lkjhggfd…) is noise. Flag when the distinct-character set is tiny.
 *  Short comments (< 8 chars) are exempt — "哈哈哈", "666", "kkk" are
 *  legitimate human reactions and would otherwise all be rejected. */
function isRepetitiveNoise(content: string): boolean {
  if (content.length < 8) return false
  const distinct = new Set(content.replace(/\s/g, "")).size
  return distinct < Math.max(2, Math.floor(content.length * 0.2))
}

// ── Turnstile ───────────────────────────────────────────────────────────

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/** Server-side Turnstile validation. Returns false when the widget token
 *  is invalid or the Cloudflare check fails; skips (returns true) only
 *  when Turnstile is not configured at all (degraded mode). */
async function verifyTurnstile(
  widgetToken: string | undefined,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured — skip
  if (!widgetToken) return false

  try {
    const body = new FormData()
    body.append("secret", secret)
    body.append("response", widgetToken)
    body.append("remoteip", ip)
    const res = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(2_000),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}

// ── Routes ──────────────────────────────────────────────────────────────

/** Public comment list for one post (oldest first). */
export async function GET(request: NextRequest) {
  const parsed = listQuery.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post slug" }, { status: 400 })
  }

  const comments = await getCommentsByPost(parsed.data.post)
  const publicComments: PublicComment[] = comments.map((c) => ({
    id: c.id,
    postSlug: c.postSlug,
    authorName: c.authorName,
    content: c.content,
    createdAt: c.createdAt,
  }))
  return NextResponse.json({ comments: publicComments })
}

/** Guest comment submission — the full anti-spam pipeline. Order is
 *  deliberate: cheap server checks first, then the paid ones. */
export async function POST(request: NextRequest) {
  // 0. Shape
  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
  }
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // 1. Master switch (settings) — spam kill-switch.
  const site = await getSiteConfig()
  if (!site.commentEnabled) {
    return NextResponse.json({ error: "Comments are closed" }, { status: 503 })
  }

  // 2. Signed session token — script POSTs without a session are
  //    rejected before anything else.
  const session = await verifyCommentSession(body.token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
  // 3. Token must match this request (post + visitor IP).
  if (session.postSlug !== body.postSlug || session.ipHash !== ipHash) {
    return NextResponse.json({ error: "Session mismatch" }, { status: 401 })
  }

  // 4. Time-trap — a script that fetched the session and POSTs
  //    immediately is rejected; humans take longer than 2 s.
  if (isBeforeMinSubmitDelay(session)) {
    return NextResponse.json(
      { error: "Comment submitted too quickly" },
      { status: 400 }
    )
  }

  // 5. Honeypot — robots fill hidden fields; silently succeed so the
  //    script gets no feedback, but never store the comment.
  if (body.website) {
    return NextResponse.json({ ok: true })
  }

  // 6. Content sanity — cheap string checks before the paid ones.
  if (countUrls(body.content) > 2) {
    return NextResponse.json({ error: "Too many links" }, { status: 400 })
  }
  if (isRepetitiveNoise(body.content)) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
  }

  // 7. Rate limits — IP, then per-post, then global (all DB-backed:
  //    serverless instances share no memory).
  const limited = [
    [ipRateScope(ipHash), RATE_LIMIT_IP_WINDOW_MS, RATE_LIMIT_IP_MAX, "Too many comments"],
    [postRateScope(body.postSlug), RATE_LIMIT_POST_WINDOW_MS, RATE_LIMIT_POST_MAX, "Too many comments on this post"],
    [GLOBAL_RATE_SCOPE, RATE_LIMIT_GLOBAL_WINDOW_MS, RATE_LIMIT_GLOBAL_MAX, "Comment flood detected"],
  ] as const
  for (const [scope, windowMs, max, message] of limited) {
    if (!(await consumeRateLimit(scope, windowMs, max))) {
      return NextResponse.json({ error: message }, { status: 429 })
    }
  }

  // 8. Turnstile — LAST, so a rejected request never consumes the
  //    single-use widget token: a 429/400 above returns without ever
  //    calling siteverify, and the visitor can retry with the same
  //    token instead of being locked out until the widget expires.
  //    (Skipped entirely when Turnstile is not configured.)
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    )
  }

  // 9. Store. A nameless visitor gets an Anonymous_ name server-side
  //    (never trust the client to pick one).
  const comment = await createComment({
    postSlug: body.postSlug,
    // zod already trimmed authorName; empty/undefined → anonymous.
    authorName: body.authorName || anonymousName(),
    authorEmail: body.authorEmail ?? "",
    content: body.content,
    ipHash,
  })
  return NextResponse.json(
    {
      comment: {
        id: comment.id,
        postSlug: comment.postSlug,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
      } satisfies PublicComment,
    },
    { status: 201 }
  )
}

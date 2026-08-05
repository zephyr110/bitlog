"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Turnstile } from "@marsidev/react-turnstile"
import { MessageSquare } from "lucide-react"
import { useT } from "@/components/layout/trans"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  COMMENT_MIN_SUBMIT_DELAY_MS,
  type PublicComment,
} from "@/lib/comment-shared"

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
// The GitHub Pages mirror (static export) has no API routes — comments
// cannot work there. Build-time flag from the CI-injected site URL:
// deploy.yml sets NEXT_PUBLIC_SITE_URL=https://zephyr110.github.io.
const STATIC_MIRROR = !!process.env.NEXT_PUBLIC_SITE_URL?.includes("github.io")

/** Guest comments, self-hosted (replaces giscus): no login, immediate
 *  display, spam-gated server-side (signed session token + Turnstile +
 *  rate limits + content filters in /api/comments). The email is stored
 *  for contact only — never rendered. */
export function CommentSection({ slug }: { slug: string }) {
  const { t } = useT()
  const site = useSiteConfig()
  const { resolvedTheme } = useTheme()

  const [comments, setComments] = useState<PublicComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  // False until the signed session is COMMENT_MIN_SUBMIT_DELAY_MS old
  // (time-trap mirror). Set from a timer rather than Date.now() at
  // render — render must stay pure.
  const [sessionReady, setSessionReady] = useState(false)
  // True when the session endpoint failed (missing SESSION_SECRET in
  // production, outage, static host) — the form shows a notice instead
  // of a silently dead submit button.
  const [sessionError, setSessionError] = useState(false)

  const [authorName, setAuthorName] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [content, setContent] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  // Bumping this re-mounts the Turnstile widget (fresh challenge).
  const [turnstileRound, setTurnstileRound] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  // The time-trap mirror timer — cleared on unmount so a stale timer
  // can't unlock a replaced form instance early.
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commentsEnabled = site.commentEnabled
  const turnstileConfigured = !!TURNSTILE_SITE_KEY

  function armSessionTimer() {
    if (armTimerRef.current) clearTimeout(armTimerRef.current)
    armTimerRef.current = setTimeout(
      () => setSessionReady(true),
      COMMENT_MIN_SUBMIT_DELAY_MS
    )
  }

  useEffect(() => {
    return () => {
      if (armTimerRef.current) clearTimeout(armTimerRef.current)
    }
  }, [])

  const canSubmit =
    !!sessionToken &&
    sessionReady &&
    !sessionError &&
    content.trim().length >= 2 &&
    content.trim().length <= 1000 &&
    !!turnstileToken

  /** Fetch a fresh signed session token; null on any failure. */
  const fetchSession = useCallback(
    async (signal?: AbortSignal): Promise<string | null> => {
      try {
        const res = await fetch(
          `/api/comments/session?post=${encodeURIComponent(slug)}`,
          { signal }
        )
        if (!res.ok) return null
        const data = (await res.json()) as { token: string }
        return data.token
      } catch {
        return null
      }
    },
    [slug]
  )

  /** Load the comment list. `signal` lets a stale navigation abort; the
   *  list is cleared first so an old post's comments never linger under
   *  a new post's heading. */
  const loadComments = useCallback(
    async (signal?: AbortSignal) => {
      setComments([])
      setLoading(true)
      try {
        const res = await fetch(
          `/api/comments?post=${encodeURIComponent(slug)}`,
          { signal }
        )
        if (!res.ok) return
        const data = (await res.json()) as { comments: PublicComment[] }
        setComments(data.comments)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        // Other failures keep the list empty — comments are progressive.
      } finally {
        setLoading(false)
      }
    },
    [slug]
  )

  /** Re-fetch the session and re-arm the form — shown as a Retry
   *  button when the first attempt failed (sessionError is not a
   *  terminal state: transient cold-starts/deploys recover). */
  const retrySession = useCallback(async () => {
    const token = await fetchSession()
    if (token) {
      setSessionToken(token)
      setSessionError(false)
      setSessionReady(false)
      armSessionTimer()
    }
  }, [fetchSession])

  // List + signed session in parallel on mount (and when the post slug
  // changes via client-side navigation). The controller aborts the
  // in-flight fetches on cleanup so a late response can't clobber the
  // next post's state. Skipped entirely on the static mirror (no API).
  useEffect(() => {
    if (STATIC_MIRROR) return
    const controller = new AbortController()
    let cancelled = false
    void loadComments(controller.signal) // eslint-disable-line react-hooks/set-state-in-effect -- async fetch, same pattern as admin/media
    ;(async () => {
      const token = await fetchSession(controller.signal)
      if (cancelled) return
      if (!token) {
        setSessionError(true)
        return
      }
      setSessionToken(token)
      setSessionError(false)
      // Time-trap mirror: the token can't be spent until it is
      // COMMENT_MIN_SUBMIT_DELAY_MS old.
      setSessionReady(false)
      armSessionTimer()
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/permalink-only: reloads fetch both fresh
  }, [slug])

  function resetTurnstile() {
    setTurnstileToken(null)
    setTurnstileRound((r) => r + 1)
  }

  async function onSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug: slug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          content: content.trim(),
          token: sessionToken,
          turnstileToken: turnstileToken ?? undefined,
          // Honeypot — hidden input; a bot filling it is silently dropped.
          website: honeypotRef.current?.value ?? "",
        }),
      })

      if (res.ok) {
        setAuthorName("")
        setAuthorEmail("")
        setContent("")
        resetTurnstile()
        // Re-mint the session: a fresh token keeps the time-trap honest
        // for the next comment. A failure here keeps the old token —
        // still valid until its TTL — so the form stays usable.
        const fresh = await fetchSession()
        if (fresh) {
          setSessionToken(fresh)
          setSessionReady(false)
          armSessionTimer()
        }
        void loadComments()
        return
      }

      // Any failed attempt gets a fresh Turnstile challenge: the widget
      // token may already be spent server-side (siteverify), and retrying
      // with a used token always fails.
      resetTurnstile()

      switch (res.status) {
        case 401: {
          // Session expired or mismatched — re-mint and let the visitor
          // resubmit instead of locking them out until a page refresh.
          const fresh = await fetchSession()
          if (fresh) {
            setSessionToken(fresh)
            setSessionError(false)
            setSessionReady(false)
            armSessionTimer()
            setError(t("post.commentErrorSessionExpired") as string)
          } else {
            setSessionError(true)
            setError(t("post.commentErrorServiceUnavailable") as string)
          }
          break
        }
        case 429:
          setError(t("post.commentErrorRateLimited") as string)
          break
        case 503:
          setError(t("post.commentErrorClosed") as string)
          break
        case 400: {
          // Server distinguishes the failure cause via a machine-
          // readable code; surface the matching message instead of
          // lumping verification/time-trap/content failures together.
          const data = (await res.json().catch(() => null)) as {
            code?: string
          } | null
          switch (data?.code) {
            case "verification_failed":
              setError(t("post.commentErrorVerify") as string)
              break
            case "too_soon":
              setError(t("post.commentErrorTooFast") as string)
              break
            default:
              setError(t("post.commentErrorInvalid") as string)
          }
          break
        }
        default:
          setError(t("post.commentErrorFailed") as string)
      }
    } catch {
      setError(t("post.commentErrorFailed") as string)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 2xl:max-w-7xl">
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare size={18} />
          </span>
          <h2 className="text-xl font-bold">
            {(t("post.commentsCount") as (n: number) => string)(comments.length)}
          </h2>
        </div>

        {/* List — the static mirror (GitHub Pages) has no API routes,
            so comments are simply not available there. */}
        {STATIC_MIRROR ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("post.commentMirrorUnavailable") as string}
          </p>
        ) : loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("post.commentEmpty") as string}
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-sm font-semibold">
                    {comment.authorName || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Form */}
        {!commentsEnabled ? (
          <p className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("post.commentClosed") as string}
          </p>
        ) : !turnstileConfigured ? (
          <p className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("post.commentNotConfigured") as string}
          </p>
        ) : sessionError ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-destructive/10 p-6 text-center text-sm text-destructive">
            <p>{t("post.commentErrorServiceUnavailable") as string}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void retrySession()}
            >
              {t("post.commentRetry") as string}
            </Button>
          </div>
        ) : (
          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void onSubmit()
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t("post.commentAuthorPlaceholder") as string}
                maxLength={30}
                className="sm:max-w-40"
              />
              <Input
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder={t("post.commentEmailPlaceholder") as string}
                type="email"
                maxLength={100}
                className="sm:max-w-56"
              />
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("post.commentContentPlaceholder") as string}
              maxLength={1000}
              rows={4}
              required
            />
            {/* Honeypot — invisible to humans, filled by bots. */}
            <input
              ref={honeypotRef}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Turnstile
                key={turnstileRound}
                siteKey={TURNSTILE_SITE_KEY!}
                onSuccess={setTurnstileToken}
                // onError must NOT re-mount the widget: a persistent
                // failure (ad-blocker, unreachable CDN) would loop
                // mount→error→mount forever. Just drop the stale token;
                // onExpire (or a successful submit's reset) re-challenges.
                onError={() => setTurnstileToken(null)}
                onExpire={resetTurnstile}
                options={{
                  theme:
                    resolvedTheme === "dark"
                      ? "dark"
                      : resolvedTheme === "light"
                        ? "light"
                        : "auto",
                }}
              />
              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="sm:ml-auto"
              >
                {submitting
                  ? (t("post.commentSubmitting") as string)
                  : (t("post.commentSubmit") as string)}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("post.commentEmailNote") as string}
            </p>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}

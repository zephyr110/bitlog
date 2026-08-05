// Comment API wire types + constants shared between the server routes
// and the client component. Deliberately dependency-free (no node:
// imports) so the client can import this file safely.

/** Public shape — the guest never sees author_email (stored, never
 *  rendered); the API strips it before responding. */
export type PublicComment = {
  id: number
  postSlug: string
  authorName: string
  content: string
  createdAt: string
}

/** Server-side time-trap floor (comment-session.ts). Mirrored on the
 *  client so the submit button stays disabled until the token is old
 *  enough — keep the two in lockstep by importing this constant. */
export const COMMENT_MIN_SUBMIT_DELAY_MS = 2_000

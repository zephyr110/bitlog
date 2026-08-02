/** Local "YYYY-MM-DD" from a Date — the shared wire contract for the
 *  admin date filters and the media/post display dates. */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** UTC datetime string (SQLite "YYYY-MM-DD HH:MM:SS") → local
 *  "YYYY-MM-DD" for display. Falls back to the date portion of the raw
 *  string when it can't be parsed. */
export function formatUtcDateTime(utc: string): string {
  const d = new Date(`${utc.replace(" ", "T")}Z`)
  if (Number.isNaN(d.getTime())) return utc.slice(0, 10)
  return formatLocalDate(d)
}

/** "YYYY-MM-DD" (the post/media wire format) → Date at UTC midnight.
 *  Dates are authored as UTC calendar dates (the API stores
 *  toISOString().split("T")[0]); parsing them as UTC keeps every
 *  computation timezone-independent — the same string renders
 *  identically in the build (SSR) and in every viewer's browser, with
 *  no hydration mismatch. */
export function parseUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

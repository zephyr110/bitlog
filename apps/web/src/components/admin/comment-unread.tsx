"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { apiFetch } from "@/lib/api-client"

const UnreadContext = createContext<number>(0)

/**
 * Polls the unread comment count once and shares it with every consumer
 * (sidebar badge, dashboard stat card) through context — one interval,
 * one request per minute instead of one per component.
 *
 * The poll uses skipAuthRedirect: a background 401 (expired session)
 * must NOT hard-redirect the admin — that would yank a logged-in editor
 * out of an unsaved form. Polling just stops; the next navigation runs
 * the layout's own auth check and lands on login naturally.
 */
export function CommentUnreadProvider({ children }: { children: ReactNode }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function refresh() {
      try {
        const res = await apiFetch("/api/admin/comments?unread=1", {
          skipAuthRedirect: true,
        })
        if (!res.ok) {
          if (res.status === 401) stop()
          return
        }
        const data = (await res.json()) as { unread: number }
        if (!stopped) setUnread(data.unread)
      } catch {
        // Transient network failure — keep the old count, retry next tick.
      }
    }

    function stop() {
      stopped = true
      if (timer) clearInterval(timer)
      window.removeEventListener("visibilitychange", onVisible)
    }

    function onVisible() {
      if (document.visibilityState === "visible") void refresh()
    }

    void refresh()
    timer = setInterval(() => void refresh(), 60_000)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return (
    <UnreadContext.Provider value={unread}>{children}</UnreadContext.Provider>
  )
}

export function useCommentUnread(): number {
  return useContext(UnreadContext)
}

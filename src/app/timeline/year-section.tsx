"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  year: number
  posts: { date: string; slug: string; title: string }[]
  defaultOpen?: boolean
}

export function YearSection({ year, posts, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="group">
      {/* Header — clickable */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-4 w-full text-left cursor-pointer mb-6"
      >
        {/* Year dot */}
        <div className="relative z-10 flex shrink-0 items-center justify-center ml-[3px] md:ml-[3px]">
          <div
            className={`absolute size-4 rounded-full transition-colors duration-300 ${
              open ? "bg-primary/30" : "bg-primary/20"
            }`}
          />
          <div
            className={`absolute size-3 rounded-full border-2 transition-all duration-300 ${
              open
                ? "border-primary/50 scale-125"
                : "border-primary/30"
            }`}
          />
          <div
            className={`size-1.5 rounded-full bg-primary transition-transform duration-300 ${
              open ? "scale-110" : ""
            }`}
          />
        </div>

        {/* Horizontal tick */}
        <div
          className={`hidden md:block w-6 h-px transition-colors duration-300 -ml-1 ${
            open ? "bg-primary/25" : "bg-primary/15"
          }`}
        />

        <h2 className="text-2xl font-bold tracking-tight tabular-nums">{year}</h2>
        <span className="text-sm text-muted-foreground/70 font-medium tabular-nums">
          {posts.length} 篇
        </span>
        <div className="ml-auto text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block tabular-nums">
          {posts[0]?.date && (
            <>
              {posts[posts.length - 1]?.date?.split("-")[1]}月 —{" "}
              {posts[0]?.date?.split("-")[1]}月
            </>
          )}
        </div>
        {/* Chevron */}
        <svg
          className={`shrink-0 size-4 text-muted-foreground/60 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Content — animated collapse/expand via grid */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative ml-[27px] md:ml-[40px]">
            {/* Connector line */}
            <div className="absolute -top-3 left-0 w-4 h-px bg-primary/10 hidden md:block" />

            <div className="space-y-0.5 pb-2">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="group/link flex items-center gap-4 px-3 py-2 -mx-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="shrink-0 size-1 rounded-full bg-primary/25 group-hover/link:bg-primary/50 transition-colors" />
                  <time className="shrink-0 w-[3.5rem] text-xs text-muted-foreground/60 font-mono tabular-nums group-hover/link:text-muted-foreground transition-colors">
                    {post.date.slice(5)}
                  </time>
                  <span className="text-sm font-medium truncate group-hover/link:text-primary transition-colors">
                    {post.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

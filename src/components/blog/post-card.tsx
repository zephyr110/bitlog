"use client"

import Link from "next/link"
import { TagBadge } from "@/components/blog/tag-badge"
import { useT } from "@/components/layout/trans"
import { type PostSummary } from "@/types"

interface PostCardProps {
  post: PostSummary
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const gradientPairs = [
  "from-rose-500 to-orange-400",
  "from-violet-500 to-purple-400",
  "from-cyan-500 to-blue-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400",
  "from-pink-500 to-rose-400",
  "from-indigo-500 to-blue-400",
  "from-fuchsia-500 to-pink-400",
]

export function PostCard({ post }: PostCardProps) {
  const { t } = useT()
  const haveCover = !!post.cover
  const shortDate = formatRelativeDate(post.date)
  const minReadLabel = t("post.minRead") as (n: number) => string
  const gradient = gradientPairs[post.title.length % gradientPairs.length]

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="h-full rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
        {/* Cover Image or Gradient Fallback */}
        <div
          className={`relative h-44 overflow-hidden ${!haveCover ? `bg-gradient-to-br ${gradient}` : ""}`}
        >
          {haveCover ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-extrabold text-white/90 select-none drop-shadow-lg">
                {post.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Reading time badge */}
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
            {minReadLabel(post.readingTime)}
          </span>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
            <time dateTime={post.date} className="font-medium">
              {shortDate}
            </time>
            {post.updated && post.updated !== post.date && (
              <>
                <span className="opacity-40">·</span>
                <span>{t("post.updated") as string}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-muted-foreground self-center ml-0.5">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { PostCardSkeleton } from "@/components/ui/loading"

/** Skeleton mirroring the category page: hero header (breadcrumb, icon +
 *  title + desc, stats), the category pill row, the sub-tag row, then the
 *  post card grid — same containers, heights, and column counts as the
 *  live page so the swap to real content causes no layout shift. */
export default function CategoryLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero — breadcrumb, icon + title + desc, stats */}
      <section className="relative overflow-hidden border-b bg-muted/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl 2xl:max-w-7xl relative">
          <nav className="mb-6 flex items-center gap-2">
            <Skeleton className="h-3.5 w-16" />
            <span className="opacity-40">/</span>
            <Skeleton className="h-3.5 w-24" />
          </nav>
          <div className="mb-4 flex items-center gap-4">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-44 md:h-10 md:w-64" />
              <Skeleton className="h-4 w-56 md:w-80" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </section>

      {/* Category pills — same wrap row as live */}
      <div className="container mx-auto px-4 py-6 max-w-5xl 2xl:max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {["w-14", "w-18", "w-16", "w-20", "w-18", "w-22", "w-16"].map(
            (w, i) => (
              <Skeleton key={i} className={`h-7 ${w} rounded-full`} />
            )
          )}
        </div>
        {/* Sub-tags — label + a few mono pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>

      {/* Post grid — same 3-up card grid as live */}
      <div className="container mx-auto px-4 pb-16 max-w-5xl 2xl:max-w-7xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

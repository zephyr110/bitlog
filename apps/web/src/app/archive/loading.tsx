import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton mirroring ArchiveFeed: toolbar row, year-nav pill, then a
 *  year heading + dense list rows. Exported so archive/page.tsx can use
 *  it as the Suspense fallback too. */
export function ArchiveFeedSkeleton() {
  return (
    <div>
      {/* Toolbar skeleton — search + topic pills, same row/height as live */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-8 w-full lg:max-w-xs rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
      {/* Year-nav pill skeleton (left-aligned, floating pill) */}
      <Skeleton className="mb-8 h-9 w-44 rounded-full" />
      {/* Year heading — accent bar + year + count */}
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-7 w-1 rounded-full" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      {/* Dense list rows */}
      <div className="divide-y divide-border/50 border-y border-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton
              className="h-4"
              style={{ width: `${72 - ((i * 13) % 40)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ArchiveLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12 2xl:max-w-7xl">
        {/* The PageHeader renders outside the Suspense boundary, so it is
            already visible — only the feed area needs a skeleton. */}
        <ArchiveFeedSkeleton />
      </div>
    </div>
  )
}

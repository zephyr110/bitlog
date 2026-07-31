import { Skeleton } from "@/components/ui/skeleton"

export default function PostLoading() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b bg-muted/10 overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl 2xl:max-w-7xl relative">
          <Skeleton className="h-4 w-48 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-5 w-2/3 mb-8" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl 2xl:max-w-7xl">
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
        <div className="my-12 border-t" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* Related posts */}
      <section className="border-t bg-muted/10">
        <div className="container mx-auto px-4 py-16 max-w-5xl 2xl:max-w-7xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

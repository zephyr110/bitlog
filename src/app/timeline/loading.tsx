import { Skeleton } from "@/components/ui/skeleton"

export default function TimelineLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="border-b bg-muted/10">
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl 2xl:max-w-7xl">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-10 w-40 mb-3" />
          <Skeleton className="h-4 w-28" />
        </div>
      </section>

      {/* Timeline */}
      <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl 2xl:max-w-7xl">
        <div className="relative">
          <div className="absolute left-[19px] md:left-[27px] top-0 bottom-0 w-px">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-border/30 to-transparent" />
          </div>
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-4 mb-6 ml-[3px]">
                  <div className="size-3 rounded-full bg-muted ring-4 ring-background shrink-0" />
                  <div className="hidden md:block w-6 h-px bg-muted -ml-1" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <div className="ml-[27px] md:ml-[40px] space-y-0.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 px-3 py-2">
                      <div className="size-1 rounded-full bg-muted shrink-0" />
                      <Skeleton className="h-3 w-[3.5rem]" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

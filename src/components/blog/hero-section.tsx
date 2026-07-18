"use client"

import { useT } from "@/components/layout/trans"

export function HeroSection({ postCount }: { postCount: number }) {
  const { t } = useT()

  const articlesLabel = t("site.articlesPublished") as (n: number) => string

  return (
    <section className="relative overflow-hidden border-b bg-muted/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

      <div className="container mx-auto px-4 py-20 md:py-28 relative">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
            {articlesLabel(postCount)}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            {t("site.heroTitleLine1") as string}
            <br />
            <span className="text-primary">{t("site.heroTitleLine2") as string}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
            {t("site.heroSubtitle") as string}
          </p>
        </div>
      </div>
    </section>
  )
}

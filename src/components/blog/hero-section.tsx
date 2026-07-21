"use client"

import { useT } from "@/components/layout/trans"
import { FileText } from "lucide-react"

export function HeroSection({ postCount }: { postCount: number }) {
  const { t } = useT()

  const articlesLabel = t("site.articlesPublished") as (n: number) => string

  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-muted/30 to-secondary/[0.08]" />
      {/* Top-right glow */}
      <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] bg-primary/15 rounded-full blur-[100px] opacity-80" />
      {/* Bottom-left glow */}
      <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-secondary/20 rounded-full blur-[100px] opacity-70" />
      {/* Accent blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px] opacity-60" />
      {/* Soft radial overlay */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.12), transparent 55%)",
        }}
      />

      <div className="container mx-auto px-4 py-12 md:py-20 relative">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/10">
            <FileText size={13} />
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

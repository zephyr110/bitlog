"use client"

import { useRef, useEffect, useCallback } from "react"
import { useT } from "@/components/layout/trans"
import { FileText } from "lucide-react"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const target = useRef({ x: -0.2, y: -0.2 })
  const current = useRef({ x: -0.2, y: -0.2 })
  const raf = useRef(0)

  const update = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    target.current = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  const leave = useCallback(() => {
    target.current = { x: -0.2, y: -0.2 }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    el.style.setProperty("--sx", "-0.2")
    el.style.setProperty("--sy", "-0.2")

    // Smooth follow loop with lerp
    const tick = () => {
      const { x: tx, y: ty } = target.current
      current.current = {
        x: lerp(current.current.x, tx, 0.08),
        y: lerp(current.current.y, ty, 0.08),
      }
      el.style.setProperty("--sx", String(current.current.x))
      el.style.setProperty("--sy", String(current.current.y))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    el.addEventListener("mousemove", update)
    el.addEventListener("mouseleave", leave)
    return () => {
      cancelAnimationFrame(raf.current)
      el.removeEventListener("mousemove", update)
      el.removeEventListener("mouseleave", leave)
    }
  }, [update, leave])

  return ref
}

export function HeroSection({ postCount }: { postCount: number }) {
  const { t } = useT()
  const spotlightRef = useSpotlight()

  const articlesLabel = t("site.articlesPublished") as (n: number) => string

  return (
    <section
      ref={spotlightRef}
      className="relative overflow-hidden border-b bg-background"
    >
      {/* ── Dot grid layer ── */}
      <div
        className="absolute inset-0 opacity-50 motion-safe:opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.04) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── Spotlight — reveals the dot grid with a warm glow ── */}
      <div
        className="absolute inset-0 transition-opacity duration-500 motion-safe:block hidden"
        style={{
          background: `
            radial-gradient(
              520px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              hsl(var(--primary) / 0.12) 0%,
              hsl(var(--primary) / 0.04) 35%,
              transparent 70%
            )
          `,
          opacity: "var(--so, 0)",
          transition: "opacity 0.6s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.setProperty("--so", "1")
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty("--so", "0")
        }}
      />

      {/* ── Lit dot grid — brighter dots under the spotlight ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.08) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          maskImage: `
            radial-gradient(
              480px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              black 0%,
              black 30%,
              transparent 70%
            )
          `,
          WebkitMaskImage: `
            radial-gradient(
              480px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              black 0%,
              black 30%,
              transparent 70%
            )
          `,
        }}
      />

      {/* ── Ambient glow blobs — complement the spotlight ── */}
      <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] bg-primary/10 rounded-full blur-[100px] opacity-70" />
      <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-secondary/12 rounded-full blur-[100px] opacity-60" />

      {/* ── Content ── */}
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

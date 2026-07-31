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

    const tick = () => {
      const { x: tx, y: ty } = target.current
      current.current = {
        x: lerp(current.current.x, tx, 0.06),
        y: lerp(current.current.y, ty, 0.06),
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
      {/* ── Layer 1: Animated aurora gradients ── */}
      <div className="absolute inset-0">
        {/* Warm amber/gold blob — slow drift */}
        <div
          className="absolute w-[50rem] h-[50rem] rounded-full blur-[120px] opacity-[0.12] dark:opacity-[0.10]"
          style={{
            background: "radial-gradient(circle, hsl(35 90% 55% / 1), transparent 70%)",
            top: "-30%",
            left: "-15%",
            animation: "hero-aurora-1 18s ease-in-out infinite",
          }}
        />
        {/* Cool blue/violet blob — counter-motion */}
        <div
          className="absolute w-[40rem] h-[40rem] rounded-full blur-[100px] opacity-[0.10] dark:opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, hsl(250 70% 55% / 1), transparent 70%)",
            bottom: "-25%",
            right: "-10%",
            animation: "hero-aurora-2 22s ease-in-out infinite",
          }}
        />
        {/* Warm center glow */}
        <div
          className="absolute w-[35rem] h-[35rem] rounded-full blur-[80px] opacity-[0.08] dark:opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "hero-aurora-3 15s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* ── Layer 2: Geometric dot grid ── */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.06) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── Layer 3: Diagonal line pattern — subtle tech feel ── */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 32px)",
        }}
      />

      {/* ── Layer 4: Spotlight glow — bright concentrated beam ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden"
        style={{
          background: `
            radial-gradient(
              800px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              hsl(var(--primary) / 0.32) 0%,
              hsl(var(--primary) / 0.12) 20%,
              hsl(var(--primary) / 0.04) 50%,
              transparent 72%
            )
          `,
          opacity: "var(--so, 0)",
          transition: "opacity 0.5s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.setProperty("--so", "1")
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty("--so", "0")
        }}
      />

      {/* ── Layer 4b: Light beams — conic rays radiating from cursor ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden pointer-events-none"
        style={{
          background: `
            repeating-conic-gradient(
              from 0deg at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              hsl(var(--primary) / 0.0) 0deg,
              hsl(var(--primary) / 0.06) 2deg,
              hsl(var(--primary) / 0.0) 4deg,
              hsl(var(--primary) / 0.04) 6deg,
              hsl(var(--primary) / 0.0) 10deg
            )
           `,
           opacity: "var(--so, 0)",
           transition: "opacity 0.5s ease",
           maskImage: `
             radial-gradient(
               600px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
               black 0%,
               black 40%,
               transparent 70%
             )
           `,
           WebkitMaskImage: `
             radial-gradient(
               600px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
               black 0%,
               black 40%,
               transparent 70%
             )
           `,
        }}
      />

      {/* ── Layer 5: Lit dots — revealed by spotlight ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          maskImage: `
            radial-gradient(
              650px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              black 0%,
              black 25%,
              transparent 65%
            )
          `,
          WebkitMaskImage: `
            radial-gradient(
              650px circle at calc(var(--sx, -0.2) * 100%) calc(var(--sy, -0.2) * 100%),
              black 0%,
              black 25%,
              transparent 65%
            )
          `,
        }}
      />

      {/* ── Layer 6: Light streaks — diagonal beams ── */}
      <div className="absolute inset-0 motion-safe:block hidden overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[2px] opacity-0"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.06), transparent)",
            top: `${30 + Math.sin(1) * 10}%`,
            left: `${20 + Math.cos(1) * 10}%`,
            transform: "rotate(-25deg)",
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute w-[500px] h-[1px] opacity-0"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.05), transparent)",
            bottom: `${35 + Math.sin(2) * 15}%`,
            right: `${15 + Math.cos(2) * 10}%`,
            transform: "rotate(-30deg)",
            filter: "blur(1px)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl 2xl:max-w-7xl relative">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Article count badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/15 backdrop-blur-sm">
            <FileText size={13} />
            {articlesLabel(postCount)}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            {t("site.heroTitleLine1") as string}
            <br />
            <span className="text-primary">{t("site.heroTitleLine2") as string}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
            {t("site.heroSubtitle") as string}
          </p>
        </div>
      </div>

      {/* ── Aurora animation keyframes ── */}
      <style>{`
        @keyframes hero-aurora-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(8%, 5%) scale(1.08); }
          50% { transform: translate(-3%, 10%) scale(0.95); }
          75% { transform: translate(-8%, -3%) scale(1.05); }
        }
        @keyframes hero-aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-5%, -8%) scale(1.06); }
          66% { transform: translate(6%, -2%) scale(0.94); }
        }
        @keyframes hero-aurora-3 {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.06; }
          100% { transform: translate(-50%, -55%) scale(1.1); opacity: 0.10; }
        }
      `}</style>
    </section>
  )
}

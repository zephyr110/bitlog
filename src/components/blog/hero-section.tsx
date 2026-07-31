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

      {/* ── Layer 4: Cone beam — stage spotlight from top-right ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden pointer-events-none"
        style={{
          opacity: "var(--so, 0)",
          transition: "opacity 0.4s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.setProperty("--so", "1")
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty("--so", "0")
        }}
      >
        {/* Main beam — cone shape from top-right */}
        <div
          className="absolute hero-beam-main"
          style={{
            top: 0,
            right: 0,
            width: "70%",
            height: "80%",
            clipPath:
              "polygon(100% 0%, 0% 100%, 12% 100%, 100% 0%, 100% 8%, 5% 100%, 0% 100%, 100% 5%)",
            background: `
              linear-gradient(
                215deg,
                hsl(var(--primary) / 0.18) 0%,
                hsl(var(--primary) / 0.08) 15%,
                hsl(var(--primary) / 0.02) 40%,
                transparent 70%
              )
            `,
            filter: "blur(30px)",
            transformOrigin: "100% 0%",
          }}
        />

        {/* Secondary thinner beam — more focused */}
        <div
          className="absolute hero-beam-secondary"
          style={{
            top: 0,
            right: 0,
            width: "55%",
            height: "65%",
            clipPath:
              "polygon(100% 0%, 0% 100%, 6% 100%, 100% 0%, 100% 4%, 2% 100%, 0% 100%, 100% 3%)",
            background: `
              linear-gradient(
                215deg,
                hsl(var(--primary) / 0.24) 0%,
                hsl(var(--primary) / 0.12) 10%,
                hsl(var(--primary) / 0.04) 30%,
                transparent 55%
              )
            `,
            filter: "blur(15px)",
            transformOrigin: "100% 0%",
          }}
        />

        {/* Core beam — sharp bright center */}
        <div
          className="absolute hero-beam-core"
          style={{
            top: 0,
            right: 0,
            width: "40%",
            height: "45%",
            clipPath:
              "polygon(100% 0%, 0% 100%, 3% 100%, 100% 0%, 100% 2%, 1% 100%, 0% 100%, 100% 1.5%)",
            background: `
              linear-gradient(
                215deg,
                hsl(var(--primary) / 0.30) 0%,
                hsl(var(--primary) / 0.14) 8%,
                hsl(var(--primary) / 0.04) 22%,
                transparent 42%
              )
            `,
            filter: "blur(6px)",
            transformOrigin: "100% 0%",
          }}
        />
      </div>

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
        /* Beam sway animation */
        @keyframes hero-beam-sway {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1.5deg); }
        }
        .hero-beam-main { animation: hero-beam-sway 8s ease-in-out infinite; }
        .hero-beam-secondary { animation: hero-beam-sway 6s ease-in-out infinite reverse; }
        .hero-beam-core { animation: hero-beam-sway 10s ease-in-out infinite; }
        /* Dark theme: slightly brighter beams for contrast against dark bg */
        :root.dark .hero-beam-main,
        .dark .hero-beam-main {
          background: linear-gradient(215deg, hsl(var(--primary) / 0.24) 0%, hsl(var(--primary) / 0.12) 15%, hsl(var(--primary) / 0.04) 40%, transparent 70%) !important;
        }
        :root.dark .hero-beam-secondary,
        .dark .hero-beam-secondary {
          background: linear-gradient(215deg, hsl(var(--primary) / 0.30) 0%, hsl(var(--primary) / 0.16) 10%, hsl(var(--primary) / 0.06) 30%, transparent 55%) !important;
        }
        :root.dark .hero-beam-core,
        .dark .hero-beam-core {
          background: linear-gradient(215deg, hsl(var(--primary) / 0.38) 0%, hsl(var(--primary) / 0.18) 8%, hsl(var(--primary) / 0.06) 22%, transparent 42%) !important;
        }
      `}</style>
    </section>
  )
}

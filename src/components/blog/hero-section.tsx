"use client"

import Link from "next/link"
import { useT } from "@/components/layout/trans"
import { ArrowRight } from "lucide-react"

const ease = { animationFillMode: "both" } as const

/* Seeded PRNG — deterministic across SSR and client, so hydration matches */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type ParticleShape = "circle" | "square" | "diamond" | "triangle" | "ring" | "cross"

const PARTICLE_HUES = [185, 190, 195, 200, 205, 210, 275, 280, 290, 300, 320, 330]
const PARTICLE_SHAPES: ParticleShape[] = ["circle", "square", "diamond", "triangle", "ring", "cross"]

function shapeStyle(
  shape: ParticleShape,
  size: number,
  color: string,
  glow?: string
): React.CSSProperties {
  const base: React.CSSProperties = { width: size, height: size }
  switch (shape) {
    case "circle":
      return {
        ...base,
        background: color,
        borderRadius: "50%",
        ...(glow ? { boxShadow: glow } : {}),
      }
    case "square":
      return { ...base, background: color }
    case "diamond":
      return { ...base, background: color, clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }
    case "triangle":
      return { ...base, background: color, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }
    case "ring":
      return { ...base, border: `1.5px solid ${color}`, borderRadius: "50%" }
    case "cross":
      return {
        ...base,
        background: color,
        clipPath:
          "polygon(35% 0, 65% 0, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0 65%, 0 35%, 35% 35%)",
      }
  }
}

/* Floating particles — drift upward from the bottom, no breathing */
const particles = (() => {
  const rand = mulberry32(42)
  return Array.from({ length: 24 }, () => ({
    left: `${(rand() * 95 + 2).toFixed(1)}%`,
    size: Math.round(rand() * 4 + 2),
    hue: PARTICLE_HUES[Math.floor(rand() * PARTICLE_HUES.length)],
    delay: +(rand() * 8).toFixed(1),
    duration: +(rand() * 5 + 8).toFixed(1),
    shape: PARTICLE_SHAPES[Math.floor(rand() * PARTICLE_SHAPES.length)],
  })) as { left: string; size: number; hue: number; delay: number; duration: number; shape: ParticleShape }[]
})()

/* Blinking particles — geometric shapes that blink (no breathing), scattered across the hero */
const pixels = (() => {
  const rand = mulberry32(7)
  return Array.from({ length: 40 }, () => ({
    left: `${(rand() * 92 + 3).toFixed(1)}%`,
    top: `${(rand() * 85 + 5).toFixed(1)}%`,
    size: Math.round(rand() * 10 + 4),
    hue: PARTICLE_HUES[Math.floor(rand() * PARTICLE_HUES.length)],
    delay: +(rand() * 6).toFixed(1),
    duration: +(rand() * 3 + 3).toFixed(1),
    shape: PARTICLE_SHAPES[Math.floor(rand() * PARTICLE_SHAPES.length)],
  }))
})()

export function HeroSection({ postCount }: { postCount: number }) {
  const { t } = useT()
  const articlesLabel = t("site.articlesPublished") as (n: number) => string

  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* ── Layer 1: Line grid — fades out from the top center ── */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklab, var(--color-foreground) 9%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--color-foreground) 9%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 95% 90% at 50% 0%, black 35%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 90% at 50% 0%, black 35%, transparent 80%)",
        }}
      />

      {/* ── Layer 2: Grid cells lighting up — a bright band sweeping left → right
             over the same 56px grid, so cells fade in then out as it passes ── */}
      <div
        className="absolute inset-0 motion-safe:block hidden opacity-[0.10] dark:opacity-[0.16]"
        aria-hidden
        style={{
          backgroundImage:
            "conic-gradient(from 90deg at 2px 2px, transparent 90deg, oklch(0.6 0.2 290) 0)",
          backgroundSize: "56px 56px",
          maskImage:
            "linear-gradient(90deg, transparent 30%, black 42%, black 58%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 30%, black 42%, black 58%, transparent 70%)",
          maskSize: "300% 100%",
          WebkitMaskSize: "300% 100%",
          maskRepeat: "no-repeat",
          animation: "hero-cells-sweep 8s linear infinite",
        }}
      />

      {/* ── Layer 3: Blinking particles — shapes that blink and breathe ── */}
      <div className="absolute inset-0 motion-safe:block hidden" aria-hidden>
        {pixels.map((p, i) => (
          <span
            key={i}
            className="hero-pixel absolute"
            style={{
              left: p.left,
              top: p.top,
              opacity: 0,
              ...shapeStyle(
                p.shape,
                p.size,
                `oklch(0.72 0.17 ${p.hue} / 0.5)`,
                `0 0 ${p.size}px oklch(0.72 0.17 ${p.hue} / 0.3)`
              ),
              animation: `hero-pixel-blink ${p.duration}s steps(1, end) ${p.delay}s infinite backwards`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 4: Floating particles — drift upward, no breathing ── */}
      <div className="absolute inset-0 motion-safe:block hidden" aria-hidden>
        {particles.map((p, i) => (
          <span
            key={i}
            className="hero-particle absolute"
            style={{
              left: p.left,
              bottom: "-8px",
              ...shapeStyle(
                p.shape,
                p.size,
                `oklch(0.78 0.18 ${p.hue})`,
                `0 0 ${p.size * 3}px ${p.size}px oklch(0.78 0.18 ${p.hue} / 0.45)`
              ),
              animation: `hero-rise ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 5: Bottom blend into the post feed ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"
        aria-hidden
      />

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 max-w-5xl 2xl:max-w-7xl relative">
        <div className="max-w-2xl">
          {/* Article count badge */}
          <div
            className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm mb-7 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={ease}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {articlesLabel(postCount)}
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ ...ease, animationDelay: "100ms" }}
          >
            {t("site.heroTitleLine1") as string}
            <br />
            <span className="bg-gradient-to-r from-foreground via-foreground/75 to-foreground/40 bg-clip-text text-transparent">
              {t("site.heroTitleLine2") as string}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ ...ease, animationDelay: "200ms" }}
          >
            {t("site.heroSubtitle") as string}
          </p>

          {/* Actions */}
          <div
            className="mt-9 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ ...ease, animationDelay: "300ms" }}
          >
            <Link
              href="#post-feed"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 dark:hover:brightness-125"
            >
              {t("site.browsePosts") as string}
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-5 py-2.5 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
            >
              {t("site.about") as string}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Animation keyframes ── */}
      <style>{`
        @keyframes hero-rise {
          0% { transform: translateY(0); opacity: 0; }
          8% { opacity: 0.9; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-75vh); opacity: 0; }
        }
        @keyframes hero-pixel-blink {
          0% { opacity: 0; }
          12% { opacity: 0.55; }
          24% { opacity: 0.1; }
          38% { opacity: 0.45; }
          52% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes hero-cells-sweep {
          from { mask-position: 100% 0; -webkit-mask-position: 100% 0; }
          to { mask-position: 0% 0; -webkit-mask-position: 0% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-particle, .hero-pixel { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

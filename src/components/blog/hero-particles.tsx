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

const SHAPES: ParticleShape[] = ["circle", "square", "diamond", "triangle", "ring", "cross"]
const HUES = [185, 190, 195, 200, 205, 210, 275, 280, 290, 300, 320, 330]

export interface ParticleDef {
  left: string
  top?: string
  size: number
  hue: number
  delay: number
  duration: number
  shape: ParticleShape
}

function shapeStyle(shape: ParticleShape, size: number, color: string, glow?: string): React.CSSProperties {
  const base: React.CSSProperties = { width: size, height: size }
  switch (shape) {
    case "circle":
      return { ...base, background: color, borderRadius: "50%", ...(glow ? { boxShadow: glow } : {}) }
    case "square":
      return { ...base, background: color }
    case "diamond":
      return { ...base, background: color, clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }
    case "triangle":
      return { ...base, background: color, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }
    case "ring":
      return { ...base, border: `1.5px solid ${color}`, borderRadius: "50%" }
    case "cross":
      return { ...base, background: color, clipPath: "polygon(35% 0, 65% 0, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0 65%, 0 35%, 35% 35%)" }
  }
}

/** Floating particles — drift upward from the bottom */
export const floatingParticles: ParticleDef[] = (() => {
  const rand = mulberry32(42)
  return Array.from({ length: 24 }, () => ({
    left: `${(rand() * 95 + 2).toFixed(1)}%`,
    size: Math.round(rand() * 4 + 2),
    hue: HUES[Math.floor(rand() * HUES.length)],
    delay: +(rand() * 8).toFixed(1),
    duration: +(rand() * 5 + 8).toFixed(1),
    shape: SHAPES[Math.floor(rand() * SHAPES.length)],
  }))
})()

/** Blinking particles — scattered across the hero */
export const blinkingParticles: ParticleDef[] = (() => {
  const rand = mulberry32(7)
  return Array.from({ length: 40 }, () => ({
    left: `${(rand() * 92 + 3).toFixed(1)}%`,
    top: `${(rand() * 85 + 5).toFixed(1)}%`,
    size: Math.round(rand() * 10 + 4),
    hue: HUES[Math.floor(rand() * HUES.length)],
    delay: +(rand() * 6).toFixed(1),
    duration: +(rand() * 3 + 3).toFixed(1),
    shape: SHAPES[Math.floor(rand() * SHAPES.length)],
  }))
})()

export function HeroParticle({ p, className }: { p: ParticleDef; className: string }) {
  return (
    <span
      className={`${className} absolute`}
      style={{
        left: p.left,
        bottom: "-8px",
        ...shapeStyle(p.shape, p.size, `oklch(0.78 0.18 ${p.hue})`, `0 0 ${p.size * 3}px ${p.size}px oklch(0.78 0.18 ${p.hue} / 0.45)`),
        animation: `hero-rise ${p.duration}s linear ${p.delay}s infinite`,
      }}
    />
  )
}

export function HeroPixel({ p }: { p: ParticleDef }) {
  return (
    <span
      className="hero-pixel absolute"
      style={{
        left: p.left,
        top: p.top,
        opacity: 0,
        ...shapeStyle(p.shape, p.size, `oklch(0.72 0.17 ${p.hue} / 0.5)`, `0 0 ${p.size}px oklch(0.72 0.17 ${p.hue} / 0.3)`),
        animation: `hero-pixel-blink ${p.duration}s steps(1, end) ${p.delay}s infinite backwards`,
      }}
    />
  )
}

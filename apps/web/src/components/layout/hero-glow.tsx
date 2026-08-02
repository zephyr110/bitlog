import { cn } from "@/lib/utils"

/**
 * Shared hero decoration: a radial primary glow anchored to the top-right
 * corner plus a soft blurred disc. Pure decoration — aria-hidden, no
 * pointer events. Consumers override the disc's position/size via
 * className (twMerge drops the defaults, e.g. "top-20 size-80").
 */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_-10%,var(--primary)_0%,transparent_60%)] opacity-[0.07] dark:opacity-[0.12]"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-20 top-16 size-72 rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.08]",
          className
        )}
      />
    </>
  )
}

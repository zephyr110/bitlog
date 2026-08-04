import { cn } from "@/lib/utils"

/**
 * Small chevron glyph. Shared by the desktop topics dropdown and the
 * mobile collapsible topics row — the mobile one rotates via className.
 */
export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-3 opacity-50", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

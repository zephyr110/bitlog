"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Popover wrapper — Base UI structure: Portal > Backdrop + Positioner
 * (anchor alignment lives here) > Popup.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  children,
}: {
  className?: string
  align?: PopoverPrimitive.Positioner.Props["align"]
  sideOffset?: number
  children: React.ReactNode
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10" />
      <PopoverPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "rounded-lg border bg-popover text-popover-foreground shadow-md outline-none",
            className
          )}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }

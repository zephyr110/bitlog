"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * shadcn-style Calendar built on react-day-picker v10. Note the v10
 * classNames keys differ from v9 (month_caption / month_grid / weekdays /
 * week / day_button; flags selected / today / outside / disabled / hidden
 * are top-level). Locale comes from date-fns/locale.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "gap-2 p-3",
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-4",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "absolute left-1 size-7 bg-transparent p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "absolute right-1 size-7 bg-transparent p-0"
        ),
        month_caption:
          "relative flex items-center justify-center pt-1 text-sm",
        caption_label: "text-sm font-medium",
        weekdays: "flex",
        weekday:
          "w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        month_grid: "w-full border-collapse",
        day: "relative p-0 text-center text-sm focus-within:relative",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "size-8 p-0 font-normal"
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

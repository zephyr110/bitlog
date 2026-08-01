"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/components/layout/trans"

/** Compact window: 1 2 3 4 … 12 (start), 1 … 9 10 11 12 (end), else
 *  1 … page-1 page page+1 … 12 — never more than 7 chips. Module-level
 *  so the windowing math is unit-testable. */
function buildPaginationItems(
  page: number,
  pageCount: number
): (number | "ellipsis")[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  if (page <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount]
  }
  if (page >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  }
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", pageCount]
}

/**
 * Shared admin pagination bar — extracted from the posts list page so the
 * media library (and any future admin list) can reuse it.
 *
 * Renders a page-size selector + "{total} {itemLabel} · Page {page}/{totalPages}"
 * on the left and prev / page-number / next controls on the right. Hidden
 * for single-page (or empty) lists — the count summary belongs in the
 * page's empty state.
 */
export function PaginationBar({
  page,
  totalPages,
  total,
  itemLabel,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  total: number
  itemLabel: string
  /** Current page size — shown in the size selector. */
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}) {
  const { t } = useT()
  // Empty lists can report totalPages = 0 — clamp so the summary and the
  // page chips always have a sane value.
  const pageCount = Math.max(1, totalPages)

  if (pageCount <= 1) return null

  const paginationItems = buildPaginationItems(page, pageCount)

  // Sticky footer bar, two regimes:
  // - Long pages (taller than the viewport): sticky bottom-0 pins the bar
  //   while scrolling — the bar is the last child of a tall page column.
  // - Short pages: the admin layout's content column is a min-h flex
  //   column and the page root grows (flex-1), so !mt-auto pushes the bar
  //   to the viewport bottom (! needed to beat space-y's margin-top).
  // Negative margins bleed the bar edge-to-edge within the admin content
  // column (p-4 md:p-8); inner padding re-aligns the text.
  return (
    <div className="sticky bottom-0 z-10 !mt-auto -mx-4 -mb-4 md:-mx-8 md:-mb-8 bg-background/85 backdrop-blur px-4 md:px-8 py-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          {total} {itemLabel} · {t("admin.page") as string} {page}/{pageCount}
        </p>
        <div className="flex items-center gap-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  size="default"
                  className="gap-1 pl-2.5"
                >
                  <ChevronLeft className="size-4" />
                  <span>{t("admin.prev") as string}</span>
                </PaginationLink>
              </PaginationItem>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={page === item}
                      onClick={() => onPageChange(item)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= pageCount}
                  size="default"
                  className="gap-1 pr-2.5"
                >
                  <span>{t("admin.next") as string}</span>
                  <ChevronRight className="size-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          {onPageSizeChange && (
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger
                size="sm"
                aria-label={t("admin.pageSize") as string}
                className="h-7 px-2 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[20, 40, 60].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}

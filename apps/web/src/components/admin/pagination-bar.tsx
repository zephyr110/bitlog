"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { useT } from "@/components/layout/trans"

/**
 * Shared admin pagination bar — extracted from the posts list page so the
 * media library (and any future admin list) can reuse it.
 *
 * Renders "{total} {itemLabel} · Page {page}/{totalPages}" on the left and
 * prev / page-number / next controls on the right. Returns null when there
 * is only one page (nothing to paginate).
 */
export function PaginationBar({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  itemLabel: string
  onPageChange: (page: number) => void
}) {
  const { t } = useT()

  // Compact window: 1 2 3 4 … 12 (start), 1 … 9 10 11 12 (end), else
  // 1 … page-1 page page+1 … 12 — never more than 7 chips.
  const paginationItems = useMemo<(number | "ellipsis")[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages]
    }
    if (page >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
  }, [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-muted-foreground">
        {total} {itemLabel} · {t("admin.page") as string} {page}/{totalPages}
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
                disabled={page >= totalPages}
                size="default"
                className="gap-1 pr-2.5"
              >
                <span>{t("admin.next") as string}</span>
                <ChevronRight className="size-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

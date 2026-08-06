"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/layout/trans"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  busy?: boolean
  title: string
  description: string
  /** Confirm button label when idle. Defaults to admin.delete. */
  confirmLabel?: string
  /** Confirm button label while busy. Defaults to admin.deleting. */
  busyLabel?: string
}

/** Shared destructive confirm used by posts and media admin pages. */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  busy = false,
  title,
  description,
  confirmLabel,
  busyLabel,
}: ConfirmDeleteDialogProps) {
  const { t } = useT()
  const idle = confirmLabel ?? (t("admin.delete") as string)
  const working = busyLabel ?? (t("admin.deleting") as string)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("admin.cancel") as string}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={busy}
          >
            {busy ? working : idle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

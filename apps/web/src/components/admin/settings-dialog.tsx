"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SiteInfoForm } from "@/components/admin/site-info-form"
import { apiFetch, clearToken } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useT()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  // Newly generated recovery key — shown once until confirmed saved.
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState(false)

  async function handleGenerateRecoveryKey() {
    setGeneratingKey(true)
    try {
      const res = await apiFetch("/api/auth/recovery", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setNewRecoveryKey(data.recoveryKey)
      } else if (res.status === 401 && data.error === "Unauthorized") {
        // Session expired — back to login.
        onOpenChange(false)
        clearToken()
        router.push("/admin/login")
      } else {
        toast.error(data.error || (t("admin.recoveryKeyGenerateFailed") as string))
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setGeneratingKey(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t("admin.passwordsNotMatch") as string)
      return
    }
    if (newPassword.length < 8) {
      toast.error(t("admin.passwordLength") as string)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t("admin.passwordChanged") as string)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        onOpenChange(false)
        if (data.requireRelogin) {
          clearToken()
          router.push("/admin/login")
        }
      } else if (res.status === 401 && data.error === "Unauthorized") {
        // Session expired (as opposed to a wrong current password) —
        // send the user back to login instead of showing an error.
        onOpenChange(false)
        clearToken()
        router.push("/admin/login")
      } else {
        toast.error(data.error || (t("admin.currentPasswordWrong") as string))
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.settings") as string}</DialogTitle>
          <DialogDescription>
            {t("admin.settingsDesc") as string}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.changePassword") as string}</CardTitle>
              <CardDesc>
                {t("admin.changePasswordDesc") as string}
              </CardDesc>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dlg-current-pw">{t("admin.currentPassword") as string}</Label>
                  <Input
                    id="dlg-current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("admin.currentPasswordPlaceholder") as string}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlg-new-pw">{t("admin.newPassword") as string}</Label>
                  <Input
                    id="dlg-new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("admin.newPasswordPlaceholder") as string}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlg-confirm-pw">{t("admin.confirmPassword") as string}</Label>
                  <Input
                    id="dlg-confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("admin.confirmPasswordPlaceholder") as string}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (t("admin.updating") as string) : (t("admin.updatePassword") as string)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recovery Key */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.recoveryKey") as string}</CardTitle>
              <CardDesc>
                {t("admin.recoveryKeyDesc") as string}
              </CardDesc>
            </CardHeader>
            <CardContent>
              {newRecoveryKey ? (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="select-all text-center font-mono text-sm font-semibold tracking-wider break-all">
                      {newRecoveryKey}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.recoveryKeyOnceOnly") as string}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(newRecoveryKey)
                          .then(() => toast.success(t("admin.urlCopied") as string))
                      }}
                    >
                      {t("admin.copyURL") as string}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setNewRecoveryKey(null)}
                    >
                      {t("admin.recoveryKeySaved") as string}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("admin.recoveryKeyHint") as string}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={generatingKey}
                    onClick={handleGenerateRecoveryKey}
                  >
                    {generatingKey
                      ? (t("admin.generatingKey") as string)
                      : (t("admin.generateRecoveryKey") as string)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Site Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.siteInfo") as string}</CardTitle>
              <CardDesc>{t("admin.siteInfoDesc") as string}</CardDesc>
            </CardHeader>
            <CardContent>
              {open ? <SiteInfoForm idPrefix="dlg-site" /> : null}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

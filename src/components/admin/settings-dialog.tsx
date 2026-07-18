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
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/lib/site-config"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useT()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t("admin.passwordsNotMatch") as string)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success(t("admin.passwordChanged") as string)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json()
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
                    placeholder="••••••••"
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
                    placeholder={t("admin.passwordLength") as string}
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
                    placeholder={t("admin.confirmPassword") as string}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (t("admin.updating") as string) : (t("admin.updatePassword") as string)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Site Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.siteInfo") as string}</CardTitle>
              <CardDesc>{t("admin.siteInfoDesc") as string}</CardDesc>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t("admin.siteName") as string}</span>
                <span className="font-medium">{siteConfig.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t("admin.siteDesc") as string}</span>
                <span className="font-medium max-w-[200px] truncate">{siteConfig.description}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{t("admin.author") as string}</span>
                <span className="font-medium">{siteConfig.author.name}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">GitHub</span>
                <span className="font-medium max-w-[200px] truncate">{siteConfig.social.github}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Twitter / X</span>
                <span className="font-medium max-w-[200px] truncate">{siteConfig.social.twitter}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">URL</span>
                <span className="font-medium">{siteConfig.siteUrl}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

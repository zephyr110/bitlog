"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SiteInfoForm } from "@/components/admin/site-info-form"
import { ChangePasswordForm } from "@/components/admin/change-password-form"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"

export default function AdminSettingsPage() {
  const { t } = useT()
  const [username, setUsername] = useState("admin")

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiFetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.user?.username) {
            setUsername(data.user.username)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchUser()
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.siteInfo") as string}</CardTitle>
          <CardDescription>
            {t("admin.siteInfoDesc") as string}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteInfoForm idPrefix="page-site" />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.changePassword") as string}</CardTitle>
          <CardDescription>
            {t("admin.changePasswordDesc") as string}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm idPrefix="page-pw" className="max-w-sm" />
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.accountInfo") as string}</CardTitle>
          <CardDescription>
            {t("admin.accountInfoDesc") as string}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{t("admin.username") as string}</span>
            <span className="font-medium">{username}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{t("admin.role") as string}</span>
            <span className="font-medium">{t("admin.administrator") as string}</span>
          </div>
          <Separator />
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{t("admin.environment") as string}</span>
            <span className="font-medium">
              {process.env.NODE_ENV === "production"
                ? (t("admin.environmentProd") as string)
                : (t("admin.localDev") as string)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

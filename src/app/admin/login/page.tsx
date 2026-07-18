"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { siteConfig } from "@/lib/site-config"
import { useT } from "@/components/layout/trans"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { setToken } from "@/lib/api-client"

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useT()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        toast.success(t("admin.welcomeBack") as string)
        router.push("/admin/dashboard")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || (t("admin.invalidCredentials") as string))
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4">
      {/* Brand */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/25">
          <span className="text-2xl font-extrabold text-primary-foreground">
            B
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {siteConfig.name} {t("admin.loginTitle") as string}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("admin.loginDesc") as string}
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("admin.username") as string}</Label>
              <Input
                ref={usernameRef}
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.password") as string}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full size-4 border-2 border-current border-t-transparent" />
                  {t("admin.signingIn") as string}
                </span>
              ) : (
                (t("admin.signIn") as string)
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-xs text-muted-foreground text-center animate-in fade-in duration-700">
        {t("admin.localDevNotice") as string}
      </p>
    </div>
  )
}

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
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useT()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
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
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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
      <Card
        className={`w-full max-w-sm shadow-xl border-border/50 bg-background/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 ${
          shake ? "animate-shake" : ""
        }`}
      >
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
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

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          75% {
            transform: translateX(6px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

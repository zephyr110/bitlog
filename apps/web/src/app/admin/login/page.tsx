"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { siteLogoSrc } from "@/lib/site-config"
import { SiteLogo } from "@/components/layout/site-logo"
import { useT } from "@/components/layout/trans"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { setToken } from "@/lib/api-client"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type LoginMode = "login" | "reset"

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useT()
  const site = useSiteConfig()
  const logoSrc = siteLogoSrc(site)
  const [mode, setMode] = useState<LoginMode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  // Reset-mode fields
  const [recoveryKey, setRecoveryKey] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [mode])

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
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || (t("admin.invalidCredentials") as string))
        setShake(true)
        window.setTimeout(() => setShake(false), 420)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t("admin.passwordsNotMatch") as string)
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, recoveryKey, newPassword }),
      })

      if (res.ok) {
        toast.success(t("admin.resetPasswordSuccess") as string)
        // Back to sign-in with the username prefilled.
        setMode("login")
        setPassword("")
        setRecoveryKey("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || (t("admin.resetPasswordFailed") as string))
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Atmosphere — vertical wash + brand-tinted glow + faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/50 via-muted/30 to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,var(--primary)_0%,transparent_60%)] opacity-[0.08] dark:opacity-[0.16]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
      />

      <div className="relative z-10 flex w-full max-w-[380px] flex-col items-center">
        {/* Brand lockup — mark + wordmark on one line, then sign-in copy */}
        <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80"
          >
            <span className="flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
              <SiteLogo
                src={logoSrc}
                invertInDark={site.logoInvertInDark ?? true}
                className="size-6"
              />
            </span>
            <span className="font-heading text-2xl font-black tracking-tight text-foreground">
              {site.name}
            </span>
          </Link>
          <h1 className="mt-4 whitespace-nowrap text-sm font-normal text-muted-foreground">
            {mode === "login"
              ? (t("admin.loginDesc") as string)
              : (t("admin.resetPassword") as string)}
          </h1>
        </div>

        <Card
          className={cn(
            "w-full gap-0 py-0 ring-foreground/10 shadow-xl shadow-foreground/[0.04] dark:shadow-black/30 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both [animation-delay:80ms]",
            mode === "login" && shake && "animate-login-shake"
          )}
        >
          <CardContent className="p-7 sm:p-8">
            {mode === "login" ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="username">{t("admin.username") as string}</Label>
                    <Input
                      ref={usernameRef}
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                      className="h-10 px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">{t("admin.password") as string}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="h-10 px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? (t("admin.hidePassword") as string)
                            : (t("admin.showPassword") as string)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-10 w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" className="text-primary-foreground" />
                        {t("admin.signingIn") as string}
                      </span>
                    ) : (
                      (t("admin.signIn") as string)
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      // Don't carry the typed password into reset mode.
                      setPassword("")
                      setShowPassword(false)
                      setMode("reset")
                    }}
                    className="h-8 self-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("admin.forgotPassword") as string}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-username">{t("admin.username") as string}</Label>
                    <Input
                      ref={usernameRef}
                      id="reset-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                      className="h-10 px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="recovery-key">{t("admin.recoveryKey") as string}</Label>
                    <Input
                      id="recovery-key"
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => setRecoveryKey(e.target.value)}
                      placeholder="ABCDE-FGHIJ-KLMNO-PQRST"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      required
                      className="h-10 px-3 font-mono text-sm tracking-wider"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-new-pw">{t("admin.newPassword") as string}</Label>
                    <Input
                      id="reset-new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder={t("admin.newPasswordPlaceholder") as string}
                      required
                      minLength={8}
                      className="h-10 px-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="reset-confirm-pw">{t("admin.confirmPassword") as string}</Label>
                    <Input
                      id="reset-confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder={t("admin.confirmPasswordPlaceholder") as string}
                      required
                      minLength={8}
                      className="h-10 px-3"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-10 w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" className="text-primary-foreground" />
                        {t("admin.resetting") as string}
                      </span>
                    ) : (
                      (t("admin.resetPassword") as string)
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      // Clear the sensitive reset fields so a stray Enter
                      // can't re-submit with the old key/password.
                      setRecoveryKey("")
                      setNewPassword("")
                      setConfirmPassword("")
                      setMode("login")
                    }}
                    className="h-8 self-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("admin.backToLogin") as string}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground animate-in fade-in duration-500 fill-mode-both [animation-delay:160ms]"
        >
          <ArrowLeft size={14} />
          {t("admin.backToSite") as string}
        </Link>
      </div>

      <style jsx global>{`
        @keyframes login-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-5px);
          }
          40% {
            transform: translateX(5px);
          }
          60% {
            transform: translateX(-3px);
          }
          80% {
            transform: translateX(3px);
          }
        }
        .animate-login-shake {
          animation: login-shake 0.42s ease-in-out;
        }
      `}</style>
    </div>
  )
}

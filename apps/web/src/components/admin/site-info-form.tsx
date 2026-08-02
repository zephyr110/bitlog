"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { siteLogoSrc, isDefaultSiteLogo } from "@/lib/site-config"
import { toast } from "sonner"
import { ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

type FormState = {
  name: string
  title: string
  description: string
  authorName: string
  logoUrl: string
  githubUrl: string
  twitterUrl: string
}

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function SiteInfoForm({ idPrefix = "site" }: { idPrefix?: string }) {
  const { t } = useT()
  const site = useSiteConfig()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>({
    name: "",
    title: "",
    description: "",
    authorName: "",
    logoUrl: "",
    githubUrl: "",
    twitterUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/site-settings")
        if (!res.ok) throw new Error("failed")
        const data = await res.json()
        if (cancelled) return
        const s = data.settings
        setForm({
          name: s.name ?? "",
          title: s.title ?? "",
          description: s.description ?? "",
          authorName: s.authorName ?? "",
          logoUrl: s.logoUrl ?? "",
          githubUrl: s.githubUrl ?? "",
          twitterUrl: s.twitterUrl ?? "",
        })
      } catch {
        if (!cancelled) {
          setForm({
            name: site.name,
            title: site.title,
            description: site.description,
            authorName: site.author.name,
            logoUrl: site.logoUrl,
            githubUrl: site.social.github,
            twitterUrl: site.social.twitter,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // Initial hydrate only — site context is a fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error(t("admin.uploadFailed") as string)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("admin.uploadFailed") as string)
      return
    }
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await apiFetch("/api/upload", {
        method: "POST",
        body,
        timeout: 120_000,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || (t("admin.uploadFailed") as string))
        return
      }
      patch("logoUrl", data.url as string)
      toast.success(t("admin.uploadSuccess") as string)
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await apiFetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || (t("admin.siteInfoSaveFailed") as string))
        return
      }
      const s = data.settings
      site.setSiteConfig((prev) => ({
        ...prev,
        name: s.name,
        title: s.title,
        description: s.description,
        author: { ...prev.author, name: s.authorName },
        logoUrl: s.logoUrl,
        social: {
          github: s.githubUrl,
          twitter: s.twitterUrl,
        },
      }))
      toast.success(t("admin.siteInfoSaved") as string)
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size="md" />
      </div>
    )
  }

  const previewSrc = siteLogoSrc({ logoUrl: form.logoUrl })
  const previewDefault = isDefaultSiteLogo({ logoUrl: form.logoUrl })

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Logo */}
      <div className="space-y-2">
        <Label>{t("admin.siteLogo") as string}</Label>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40",
              previewDefault && "dark:bg-foreground/5"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className={cn(
                "size-12 object-contain",
                previewDefault && "dark:invert"
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (file) void handleUpload(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Spinner size="sm" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading
                ? (t("admin.uploading") as string)
                : (t("admin.uploadLogo") as string)}
            </Button>
            {form.logoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patch("logoUrl", "")}
              >
                <X className="size-3.5" />
                {t("admin.removeLogo") as string}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="size-3.5" />
                {t("admin.defaultLogo") as string}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>
            {t("admin.siteName") as string}
          </Label>
          <Input
            id={`${idPrefix}-name`}
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>
            {t("admin.siteTitle") as string}
          </Label>
          <Input
            id={`${idPrefix}-title`}
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
            required
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-desc`}>
          {t("admin.siteDesc") as string}
        </Label>
        <Textarea
          id={`${idPrefix}-desc`}
          value={form.description}
          onChange={(e) => patch("description", e.target.value)}
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-author`}>
          {t("admin.author") as string}
        </Label>
        <Input
          id={`${idPrefix}-author`}
          value={form.authorName}
          onChange={(e) => patch("authorName", e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-github`}>
            {t("admin.github") as string}
          </Label>
          <Input
            id={`${idPrefix}-github`}
            type="url"
            value={form.githubUrl}
            onChange={(e) => patch("githubUrl", e.target.value)}
            maxLength={300}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-twitter`}>
            {t("admin.twitter") as string}
          </Label>
          <Input
            id={`${idPrefix}-twitter`}
            type="url"
            value={form.twitterUrl}
            onChange={(e) => patch("twitterUrl", e.target.value)}
            maxLength={300}
            placeholder="https://x.com/..."
          />
        </div>
      </div>

      <Button type="submit" disabled={saving || uploading}>
        {saving ? (t("admin.saving") as string) : (t("admin.saveSiteInfo") as string)}
      </Button>
    </form>
  )
}

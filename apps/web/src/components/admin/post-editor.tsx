"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { type Post } from "@bitlog/database"
import { MediaPickerDialog } from "@/components/admin/media-picker-dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/icon-button"
import {
  Bold,
  Italic,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  ExternalLink,
  ImagePlus,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PostEditorProps {
  initialPost?: Post
  isNew?: boolean
}

interface ToolbarItem {
  key: string
  i18nKey: string
  icon: LucideIcon
  /** Prefix inserted before selection */
  prefix: string
  /** Suffix inserted after selection */
  suffix?: string
  /** Wrap selection inline (for links) */
  inline?: boolean
}

const TOOLBAR: ToolbarItem[] = [
  { key: "bold", i18nKey: "admin.bold", icon: Bold, prefix: "**", suffix: "**" },
  { key: "italic", i18nKey: "admin.italic", icon: Italic, prefix: "*", suffix: "*" },
  { key: "heading", i18nKey: "admin.heading", icon: Heading2, prefix: "## " },
  { key: "quote", i18nKey: "admin.quote", icon: Quote, prefix: "> " },
  { key: "ul", i18nKey: "admin.unorderedList", icon: List, prefix: "- " },
  { key: "ol", i18nKey: "admin.orderedList", icon: ListOrdered, prefix: "1. " },
  { key: "code", i18nKey: "admin.codeBlock", icon: Code, prefix: "```\n", suffix: "\n```" },
  { key: "link", i18nKey: "admin.link", icon: LinkIcon, prefix: "[", suffix: "](https://)", inline: true },
]

export function PostEditor({ initialPost, isNew = false }: PostEditorProps) {
  const { t } = useT()
  const router = useRouter()

  const [title, setTitle] = useState(initialPost?.title || "")
  const [slug, setSlug] = useState(initialPost?.slug || "")
  const [description, setDescription] = useState(initialPost?.description || "")
  const [content, setContent] = useState(initialPost?.content || "")
  const [tags, setTags] = useState<string[]>(initialPost?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [cover, setCover] = useState(initialPost?.cover || "")
  const [draft, setDraft] = useState(initialPost?.draft ?? true)
  const [saving, setSaving] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const desktopContentRef = useRef<HTMLTextAreaElement>(null)
  const mobileContentRef = useRef<HTMLTextAreaElement>(null)

  // Track unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const initial = initialPost
    if (!initial && isNew) {
      return (
        title !== "" ||
        slug !== "" ||
        description !== "" ||
        content !== "" ||
        tags.length > 0 ||
        cover !== ""
      )
    }
    if (!initial) return false
    return (
      title !== initial.title ||
      slug !== initial.slug ||
      description !== initial.description ||
      content !== initial.content ||
      tags.join(",") !== initial.tags.join(",") ||
      cover !== (initial.cover || "") ||
      draft !== initial.draft
    )
  }, [title, slug, description, content, tags, cover, draft, initialPost, isNew])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  // Keep a ref to the latest savePost so the keyboard shortcut doesn't
  // re-register on every render or close over stale state.
  const savePostRef = useRef(savePost)
  useEffect(() => {
    savePostRef.current = savePost
  })

  // Ctrl/Cmd+S shortcut — always save as draft, don't publish
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        savePostRef.current(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-save draft every 30s when there are unsaved changes.
  // New posts are excluded — auto-saving would create the post early
  // and navigate away from the editor mid-typing.
  // Latest state is read via refs so the interval stays stable
  // (hasUnsavedChanges changes on every keystroke — a dependency here
  // would reset the timer continuously and auto-save would never fire
  // while the user is typing).
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])
  const savingRef = useRef(saving)
  useEffect(() => {
    savingRef.current = saving
  }, [saving])
  const autoSavedRef = useRef(false)
  useEffect(() => {
    if (isNew) return
    const interval = setInterval(() => {
      if (hasUnsavedChangesRef.current() && !savingRef.current) {
        autoSavedRef.current = true
        savePostRef.current(false, true)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [isNew])

  // Word / char count — CJK characters count as words too
  const cjkRegex = /[一-龥぀-ゟ゠-ヿ가-힯]/g
  const cjkCount = (content.match(cjkRegex) || []).length
  const nonCjkWords = content
    .replace(cjkRegex, " ")
    .split(/\s+/)
    .filter(Boolean).length
  const wordCount = cjkCount + nonCjkWords
  const charCount = content.length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (isNew && !slug) {
      setSlug(
        newTitle
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 80)
      )
    }
  }

  function addTag() {
    const raw = tagInput.trim().toLowerCase()
    if (!raw) {
      setTagInput("")
      return
    }
    const newTags = raw
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t))
    if (newTags.length) {
      setTags([...tags, ...newTags])
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  /** The currently visible content textarea (split view vs mobile tabs). */
  function getActiveTextarea(): HTMLTextAreaElement | null {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches
    return isDesktop ? desktopContentRef.current : mobileContentRef.current
  }

  /** Insert markdown at the current textarea cursor position. */
  function insertAtCursor(text: string) {
    const textarea = getActiveTextarea()
    const start = textarea?.selectionStart ?? content.length
    const end = textarea?.selectionEnd ?? content.length
    const next = content.slice(0, start) + text + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      if (!textarea) return
      textarea.focus()
      const pos = start + text.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  function applyToolbar(item: ToolbarItem) {
    const textarea = getActiveTextarea()
    const start = textarea?.selectionStart ?? content.length
    const end = textarea?.selectionEnd ?? content.length
    const selected = content.slice(start, end)

    if (item.inline) {
      const inner = selected || (t("admin.linkText") as string)
      insertAtCursor(item.prefix + inner + (item.suffix ?? ""))
      return
    }

    insertAtCursor(item.prefix + selected + (item.suffix ?? ""))
  }

  function insertImage(url: string) {
    insertAtCursor(`![${t("admin.uploadedImageAlt") as string}](${url})`)
  }

  async function savePost(publish = false, silent = false) {
    setSaving(true)

    const postData = {
      title,
      slug,
      description,
      content,
      tags,
      cover,
      draft: publish ? false : draft,
    }

    try {
      const url = isNew
        ? "/api/posts"
        : `/api/posts?slug=${encodeURIComponent(initialPost?.slug || "")}`
      const method = isNew ? "POST" : "PUT"

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (res.ok) {
        const data = await res.json()
        const savedDraft = data.post.draft ?? draft
        setDraft(savedDraft)
        if (publish) {
          toast.success(t("admin.publishSuccess") as string)
        } else if (!silent) {
          toast.success(
            savedDraft
              ? (t("admin.draftSaved") as string)
              : (t("admin.postUpdated") as string)
          )
        } else if (autoSavedRef.current) {
          autoSavedRef.current = false
          toast.success(t("admin.autoSaved") as string)
        }
        if (isNew) {
          router.push(
            `/admin/posts/edit?slug=${encodeURIComponent(data.post.slug)}`
          )
        }
        router.refresh()
      } else {
        const err = await res.json()
        if (!silent) {
          toast.error(err.error || (t("admin.failedToSavePost") as string))
        }
      }
    } catch {
      if (!silent) {
        toast.error(t("admin.networkErrorSave") as string)
      }
    } finally {
      setSaving(false)
      autoSavedRef.current = false
    }
  }

  const previewPanel = (
    <div className="prose dark:prose-invert max-w-none min-h-[400px] lg:min-h-[calc(100vh-24rem)] border rounded-lg p-6 bg-card prose-p:my-4 prose-headings:mt-6 prose-headings:mb-3">
      {content ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || ""}
                className="rounded-lg"
                loading="lazy"
              />
            ),
            pre: ({ children }) => (
              <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4">
                {children}
              </pre>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-muted-foreground italic">
          {t("admin.previewEmpty") as string}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl border-b flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
            {isNew ? (t("admin.newPost") as string) : (t("admin.editPost") as string)}
          </h1>
          {!isNew && !draft && (
            <a
              href={`/posts/${encodeURIComponent(slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
            >
              <ExternalLink size={12} />
              {t("admin.viewOnline") as string}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => savePost(false)}
            disabled={saving}
          >
            {saving ? (t("admin.saving") as string) : (t("admin.saveDraft") as string)}
          </Button>
          <Button size="sm" onClick={() => savePost(true)} disabled={saving}>
            {saving ? (t("admin.publishing") as string) : (t("admin.publish") as string)}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("admin.title") as string}</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder={t("admin.title") as string}
              className="text-lg"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">{t("admin.slug") as string}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t("admin.slugPlaceholder") as string}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">{t("admin.coverImage") as string}</Label>
              <div className="flex gap-2">
                <Input
                  id="cover"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder={t("admin.coverPlaceholder") as string}
                />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={t("admin.pickCoverImage") as string}
                        onClick={() => setCoverPickerOpen(true)}
                      >
                        <ImagePlus size={16} />
                      </Button>
                    }
                  />
                  <TooltipContent>
                    {t("admin.pickCoverImage") as string}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {cover && (
            <div className="relative rounded-lg border overflow-hidden max-h-48 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt=""
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{t("admin.description") as string}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("admin.description") as string}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("admin.tags") as string}</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t("admin.addTag") as string}
                className="flex-1"
              />
              <Button variant="outline" onClick={addTag} type="button">
                {t("admin.addTagButton") as string}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer group/tag hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <span className="ml-1 text-muted-foreground group-hover/tag:text-destructive">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Editor — split view on desktop, tabs on mobile */}
      <Card>
        <CardContent className="pt-6">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 mb-3 flex-wrap">
            {TOOLBAR.map((item) => {
              const Icon = item.icon
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger
                    render={
                      <IconButton
                        size="sm"
                        aria-label={t(item.i18nKey) as string}
                        onClick={() => applyToolbar(item)}
                      >
                        <Icon size={15} />
                      </IconButton>
                    }
                  />
                  <TooltipContent>
                    {t(item.i18nKey) as string}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            <span className="w-px h-5 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger
                render={
                  <IconButton
                    size="sm"
                    aria-label={t("admin.insertImage") as string}
                    onClick={() => setImagePickerOpen(true)}
                  >
                    <ImageIcon size={15} />
                  </IconButton>
                }
              />
              <TooltipContent>
                {t("admin.insertImage") as string}
              </TooltipContent>
            </Tooltip>
            <span className="w-px h-5 bg-border mx-1" />
            {/* Collapse/expand preview (desktop split view) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <IconButton
                    size="sm"
                    aria-label={
                      previewCollapsed
                        ? (t("admin.expandPreview") as string)
                        : (t("admin.collapsePreview") as string)
                    }
                    onClick={() => setPreviewCollapsed(!previewCollapsed)}
                    className={
                      previewCollapsed
                        ? "text-primary bg-primary/10 hover:bg-primary/15"
                        : undefined
                    }
                  >
                    {previewCollapsed ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff size={15} />
                    )}
                  </IconButton>
                }
              />
              <TooltipContent>
                {previewCollapsed
                  ? (t("admin.expandPreview") as string)
                  : (t("admin.collapsePreview") as string)}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Split view (lg+) — preview on the left, editor on the right.
              The preview pane can be collapsed to give the editor full width. */}
          <div
            className={cn(
              "hidden lg:grid gap-4",
              previewCollapsed ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {!previewCollapsed && previewPanel}
            <Textarea
              ref={desktopContentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("admin.contentPlaceholder") as string}
              className="font-mono min-h-[400px] lg:min-h-[calc(100vh-24rem)] resize-y"
            />
          </div>

          {/* Tabs (mobile) */}
          <Tabs defaultValue="edit" className="lg:hidden">
            <TabsList className="mb-4">
              <TabsTrigger value="edit">{t("admin.editTab") as string}</TabsTrigger>
              <TabsTrigger value="preview">{t("admin.previewTab") as string}</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                ref={mobileContentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("admin.contentPlaceholder") as string}
                className="font-mono min-h-[400px]"
              />
            </TabsContent>
            <TabsContent value="preview">{previewPanel}</TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground mt-2">
            {t("admin.editHint") as string}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{(t("post.chars") as (n: number) => string)(charCount)}</span>
        <span>{(t("post.words") as (n: number) => string)(wordCount)}</span>
        <span>{(t("post.readTime") as (n: number) => string)(readTime)}</span>
      </div>

      {/* Status */}
      <div className={cn("flex items-center gap-3 text-sm text-muted-foreground rounded-lg border bg-card p-3")}>
        <Badge
          variant={draft ? "secondary" : "default"}
          className={
            draft
              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
          }
        >
          {draft
            ? (t("admin.draft") as string)
            : (t("admin.publishedStatus") as string)}
        </Badge>
        <span>
          {draft
            ? (t("admin.draftDesc") as string)
            : (t("admin.publishedDesc") as string)}
        </span>
      </div>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        onSelect={setCover}
      />
      <MediaPickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={insertImage}
      />
    </div>
  )
}

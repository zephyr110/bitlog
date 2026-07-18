"use client"

import { useState, useEffect, useCallback } from "react"
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
import { type Post } from "@/types"

interface PostEditorProps {
  initialPost?: Post
  isNew?: boolean
}

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
      cover !== (initial.cover || "")
    )
  }, [title, slug, description, content, tags, cover, initialPost, isNew])

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

  // Ctrl/Cmd+S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        savePost(draft)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  // Word count
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const charCount = content.length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 80)
      )
    }
  }, [title, slug, isNew])

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
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

  async function savePost(publish = false) {
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
      const url = isNew ? "/api/posts" : `/api/posts?slug=${initialPost?.slug}`
      const method = isNew ? "POST" : "PUT"

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (res.ok) {
        const data = await res.json()
        if (publish) {
          toast.success(t("admin.publishSuccess") as string)
        } else {
          toast.success(draft ? (t("admin.draftSaved") as string) : (t("admin.postUpdated") as string))
        }
        if (isNew) {
          router.push(`/admin/posts/edit?slug=${data.post.slug}`)
        }
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save post")
      }
    } catch {
      toast.error("Network error. Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? (t("admin.newPost") as string) : (t("admin.editPost") as string)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => savePost(false)}
            disabled={saving}
          >
            {saving ? (t("admin.saving") as string) : (t("admin.saveDraft") as string)}
          </Button>
          <Button onClick={() => savePost(true)} disabled={saving}>
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
              onChange={(e) => setTitle(e.target.value)}
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
                placeholder="post-url-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">{t("admin.coverImage") as string}</Label>
              <Input
                id="cover"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="/images/cover.jpg"
              />
            </div>
          </div>

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
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="edit">
            <TabsList className="mb-4">
              <TabsTrigger value="edit">{t("admin.editTab") as string}</TabsTrigger>
              <TabsTrigger value="preview">{t("admin.previewTab") as string}</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content in Markdown..."
                className="font-mono min-h-[400px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("admin.editHint") as string}
              </p>
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose dark:prose-invert max-w-none min-h-[400px] border rounded-lg p-6 bg-card">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{charCount} 字</span>
        <span>{wordCount} 词</span>
        <span>~{readTime} 分钟阅读</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={draft ? "secondary" : "default"}>
          {draft ? (t("admin.draft") as string) : (t("admin.publishedStatus") as string)}
        </Badge>
        <span>
          {draft
            ? (t("admin.draftDesc") as string)
            : (t("admin.publishedDesc") as string)}
        </span>
      </div>
    </div>
  )
}

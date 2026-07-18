"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PostEditor } from "@/components/admin/post-editor"
import { apiFetch } from "@/lib/api-client"
import { Spinner } from "@/components/ui/spinner"
import { type Post } from "@/types"
import { Suspense } from "react"

function EditPostContent() {
  const searchParams = useSearchParams()
  const slug = searchParams?.get("slug")
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      router.push("/admin/posts")
      return
    }

    async function fetchPost() {
      try {
        const res = await apiFetch(`/api/posts?slug=${slug}`)
        if (res.ok) {
          const data = await res.json()
          setPost(data.post)
        } else {
          router.push("/admin/posts")
        }
      } catch {
        router.push("/admin/posts")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!post) return null

  return <PostEditor initialPost={post} />
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner /></div>}>
      <EditPostContent />
    </Suspense>
  )
}

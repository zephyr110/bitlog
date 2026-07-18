import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import {
  getAllPosts,
  savePost,
  getPublishedPosts,
  getPostBySlug,
  deletePost,
  movePost,
  slugify,
} from "@/lib/content"
import { type Post } from "@/types"

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // Single post query
  const slug = searchParams.get("slug")
  if (slug) {
    const post = getPostBySlug(slug, true)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json({ post })
  }

  // List query
  const includeDrafts = searchParams.get("includeDrafts") !== "false"
  const posts = includeDrafts ? getAllPosts(true) : getPublishedPosts()
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const slug = body.slug || slugify(body.title || "")

  // Check for duplicate slug
  const existing = getPostBySlug(slug, true)
  if (existing) {
    return NextResponse.json(
      { error: "A post with this slug already exists" },
      { status: 409 }
    )
  }

  const post: Post = {
    slug,
    title: body.title || "Untitled",
    date: body.date || new Date().toISOString().split("T")[0],
    updated: body.updated,
    tags: body.tags || [],
    description: body.description || "",
    cover: body.cover,
    draft: body.draft ?? true,
    content: body.content || "",
    wordCount: 0,
    readingTime: 1,
  }

  savePost(post)
  return NextResponse.json({ post }, { status: 201 })
}

// PUT /api/posts?slug=xxx — update a post
export async function PUT(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const existingPost = getPostBySlug(slug, true)
  if (!existingPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const body = await request.json()
  const newSlug = body.slug || slug
  if (newSlug !== slug) {
    // Check for duplicate slug on rename
    const conflict = getPostBySlug(newSlug, true)
    if (conflict) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      )
    }
    deletePost(slug)
  }

  const updatedPost: Post = {
    ...existingPost,
    title: body.title ?? existingPost.title,
    slug: newSlug,
    date: body.date ?? existingPost.date,
    updated: new Date().toISOString().split("T")[0],
    tags: body.tags ?? existingPost.tags,
    description: body.description ?? existingPost.description,
    cover: body.cover ?? existingPost.cover,
    draft: body.draft ?? existingPost.draft,
    content: body.content ?? existingPost.content,
  }

  savePost(updatedPost)
  return NextResponse.json({ post: updatedPost })
}

// DELETE /api/posts?slug=xxx — delete a post
export async function DELETE(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const deleted = deletePost(slug)
  if (!deleted) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/posts?slug=xxx — publish / unpublish
export async function PATCH(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const body = await request.json()
  const toDraft = body.draft ?? false

  const updatedPost = movePost(slug, toDraft)
  if (!updatedPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ post: updatedPost })
}

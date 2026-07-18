export const dynamic = "force-static"

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { writeFile, mkdir, readdir } from "fs/promises"
import path from "path"

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const imagesDir = path.join(process.cwd(), "public", "images")

  try {
    const files = await readdir(imagesDir)
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]

    const images = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return allowedExtensions.includes(ext)
      })
      .map((file) => ({
        name: file,
        url: `/images/${file}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ images })
  } catch {
    // Directory doesn't exist yet — return empty list
    return NextResponse.json({ images: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}-${safeName}`

    const uploadDir = path.join(process.cwd(), "public", "images")
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const url = `/images/${filename}`
    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { writeFile, mkdir, readdir } from "fs/promises"
import path from "path"

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Magic numbers for the most common image formats.
const MAGIC_NUMBERS: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46],
}

function hasValidMagicBytes(buffer: Buffer, type: string): boolean {
  const signature = MAGIC_NUMBERS[type]
  if (!signature) return true // SVG is checked separately
  return signature.every((byte, i) => buffer[i] === byte)
}

function looksLikeSvg(buffer: Buffer): boolean {
  const snippet = buffer.slice(0, 256).toString("utf-8").trim().toLowerCase()
  return snippet.startsWith("<?xml") || snippet.startsWith("<svg")
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const ext = path.extname(base).toLowerCase()
  const stem = path.basename(base, ext)
  // Reject double extensions / anything suspicious.
  const cleanExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".bin"
  return `${stem.slice(0, 50)}${cleanExt}`
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const imagesDir = path.join(process.cwd(), "public", "images")

  try {
    const files = await readdir(imagesDir)

    const images = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return ALLOWED_EXTENSIONS.includes(ext)
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
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file content, not just MIME type.
    if (file.type === "image/svg+xml") {
      if (!looksLikeSvg(buffer)) {
        return NextResponse.json(
          { error: "Invalid SVG content" },
          { status: 400 }
        )
      }
    } else if (!hasValidMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its extension" },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const safeName = sanitizeFilename(file.name)
    const filename = `${timestamp}-${safeName}`

    const uploadDir = path.join(process.cwd(), "public", "images")
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const url = `/images/${filename}`
    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

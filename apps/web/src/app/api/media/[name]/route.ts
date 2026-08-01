import { NextRequest, NextResponse } from "next/server"
import { getMediaData } from "@bitlog/database"

/** Serves the Turso copy of a media file — disaster-recovery fallback for
 *  jsdelivr and the read path for exports. Public, like jsdelivr itself. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  // Plain filename only — no path segments, no hidden files.
  if (
    !name ||
    name.includes("/") ||
    name.includes("\\") ||
    name.startsWith(".")
  ) {
    return new NextResponse("Not found", { status: 404 })
  }

  const record = await getMediaData(name)
  if (!record) {
    return new NextResponse("Not found", { status: 404 })
  }

  return new NextResponse(Buffer.from(record.data), {
    headers: {
      "Content-Type": record.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  })
}

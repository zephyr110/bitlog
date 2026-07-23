import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes; public routes and login are always accessible.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  const token = request.cookies.get("blog-admin-token")?.value
  let user = null
  if (token) {
    try {
      user = await verifyToken(decodeURIComponent(token))
    } catch {
      // decodeURIComponent may throw on malformed cookie value
    }
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

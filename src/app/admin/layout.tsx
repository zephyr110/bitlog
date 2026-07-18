"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getToken, apiFetch, clearToken } from "@/lib/api-client"
import { PageLoader } from "@/components/ui/page-loader"
import { type AuthUser } from "@/types"

export const SidebarCollapsedContext = createContext(false)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    async function checkAuth() {
      const token = getToken()
      if (!token) {
        router.push("/admin/login")
        setLoading(false)
        return
      }

      try {
        const res = await apiFetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          clearToken()
          router.push("/admin/login")
        }
      } catch {
        clearToken()
        router.push("/admin/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [isLoginPage, router])

  if (loading && !isLoginPage) {
    return <PageLoader />
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? "4rem" : "16rem" }}
      >
        <div className="p-8">{children}</div>
      </div>
    </div>
  )
}

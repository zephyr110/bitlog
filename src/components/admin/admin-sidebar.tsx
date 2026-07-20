"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { clearToken } from "@/lib/api-client"
import { SettingsDialog } from "@/components/admin/settings-dialog"
import { siteConfig } from "@/lib/site-config"
import { useLocale } from "@/components/layout/i18n-provider"
import { useT } from "@/components/layout/trans"
import { localeLabels, locales } from "@/lib/i18n"
import { type AuthUser } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  FileText,
  Image,
  ExternalLink,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"

const sidebarLinks = [
  { href: "/admin/dashboard", i18nKey: "admin.dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", i18nKey: "admin.posts", icon: FileText },
  { href: "/admin/media", i18nKey: "admin.media", icon: Image },
]

type ThemeMode = "light" | "dark" | "system"

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
  user: AuthUser
}

export function AdminSidebar({ collapsed, onToggle, user }: AdminSidebarProps) {
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()

  const currentTheme = (theme as ThemeMode) || "system"
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleLogout() {
    clearToken()
    router.push("/admin/login")
    router.refresh()
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onToggle])

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-sidebar-border transition-all shrink-0",
          collapsed ? "px-3 justify-center" : "px-5 justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold shadow-sm shadow-primary/20 transition-all group-hover:shadow-md group-hover:shadow-primary/25 group-hover:scale-[1.02]">
              B
            </span>
            <div className="leading-tight min-w-0">
              <span className="font-bold text-base tracking-tight block truncate">{siteConfig.name}</span>
              <span className="block text-[10px] text-sidebar-foreground/60 font-medium tracking-wide uppercase">{t("admin.adminPanel") as string}</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin/dashboard" className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold shrink-0 shadow-sm shadow-primary/20 transition-all hover:shadow-md hover:shadow-primary/25 hover:scale-[1.02]">
            B
          </Link>
        )}
      </div>

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2.5" : "px-3")}>
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            {t("admin.menu") as string}
          </p>
        )}
        <nav className="space-y-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin/dashboard" && pathname?.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? (t(link.i18nKey) as string) : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
              )}
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )}
              />
              {!collapsed && (
                <span className="truncate">{t(link.i18nKey) as string}</span>
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="my-2 mx-3 border-t" />

        {/* View Blog - external link */}
        <Link
          href="/"
          target="_blank"
          title={collapsed ? (t("admin.viewBlog") as string) : undefined}
          className={cn(
            "group flex items-center gap-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200",
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          )}
        >
          <ExternalLink size={18} className="shrink-0 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
          {!collapsed && <span className="truncate">{t("admin.viewBlog") as string}</span>}
        </Link>
        </nav>
      </div>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border bg-sidebar", collapsed ? "p-2.5 space-y-1" : "p-3 space-y-1")}>
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200",
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          )}
          title={collapsed ? (t("admin.expand") as string) : (t("admin.collapse") as string)}
        >
          <ChevronLeft
            size={18}
            className={cn(
              "shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>{t("admin.collapse") as string}</span>}
        </button>

        {/* Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "group flex items-center gap-3 rounded-xl hover:bg-sidebar-accent/70 w-full outline-none focus:ring-0 transition-all duration-200 border border-transparent hover:border-sidebar-border",
              collapsed ? "justify-center px-0 py-2" : "px-2 py-2"
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="size-9 ring-2 ring-sidebar-border transition-shadow group-hover:ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 text-primary font-semibold text-xs">
                  A
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-[2.5px] ring-sidebar" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{user.username}</p>
                    <Badge variant="secondary" className="h-4 px-1 text-[9px] font-medium">
                      {t("admin.administrator") as string}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-sidebar-foreground/60 truncate">{siteConfig.author.name}</p>
                </div>
                <ChevronRight size={14} className="text-sidebar-foreground/50 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={8}
            className="w-64 p-1.5"
          >
            {/* User info card */}
            <div className="m-1 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 ring-2 ring-border shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 text-primary font-semibold text-sm">
                    A
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{user.username}</p>
                    <Badge variant="secondary" className="h-4 px-1 text-[9px] font-medium">
                      {t("admin.administrator") as string}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{siteConfig.author.name}</p>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Appearance group */}
            <div className="px-1 py-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                {t("admin.theme") as string}
              </p>
              <div className="inline-flex w-full rounded-lg bg-muted/50 p-1 mt-0.5">
                {([
                  ["light", Sun],
                  ["dark", Moon],
                  ["system", Monitor],
                ] as const).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      currentTheme === mode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    title={mode === "light" ? (t("admin.light") as string) : mode === "dark" ? (t("admin.dark") as string) : (t("admin.system") as string)}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">
                      {mode === "light"
                        ? (t("admin.light") as string)
                        : mode === "dark"
                          ? (t("admin.dark") as string)
                          : (t("admin.system") as string)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language group */}
            <div className="px-1 py-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                {t("admin.language") as string}
              </p>
              <div className="inline-flex w-full rounded-lg bg-muted/50 p-1 mt-0.5">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      locale === l
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {localeLabels[l]}
                  </button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="py-2.5 gap-2.5 cursor-pointer rounded-md">
              <Settings size={16} className="opacity-60 shrink-0" />
              <span>{t("admin.settings") as string}</span>
            </DropdownMenuItem>

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="py-2.5 gap-2.5 text-destructive focus:text-destructive cursor-pointer rounded-md">
              <LogOut size={16} className="opacity-60 shrink-0" />
              <span>{t("admin.logout") as string}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  )
}

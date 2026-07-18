"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { clearToken } from "@/lib/api-client"
import { siteConfig } from "@/lib/site-config"
import { useLocale } from "@/components/layout/i18n-provider"
import { useT } from "@/components/layout/trans"
import { type Locale, localeLabels, locales } from "@/lib/i18n"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  Check,
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
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()

  const currentTheme = (theme as ThemeMode) || "system"

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
        "fixed top-0 left-0 h-full border-r bg-card flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b transition-all",
          collapsed ? "px-4 justify-center" : "px-6 justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 font-bold text-lg">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold">
              B
            </span>
            {siteConfig.name} Admin
          </Link>
        )}
        {collapsed && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold shrink-0">
            B
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-4")}>
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          )}
          title={collapsed ? t("admin.expand") as string : t("admin.collapse") as string}
        >
          <ChevronLeft
            size={18}
            className={cn(
              "shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && (t("admin.collapse") as string)}
        </button>

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
                "flex items-center gap-3 rounded-md text-sm font-medium transition-all",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={18} />
              {!collapsed && (t(link.i18nKey) as string)}
            </Link>
          )
        })}

        {/* View Blog - after Media */}
        <Link
          href="/"
          target="_blank"
          title={collapsed ? (t("admin.viewBlog") as string) : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          )}
        >
          <ExternalLink size={18} />
          {!collapsed && (t("admin.viewBlog") as string)}
        </Link>
      </nav>

      {/* Footer */}
      <div className={cn("border-t space-y-1", collapsed ? "p-2" : "p-4")}>
        {/* Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-3 rounded-lg hover:bg-muted transition-colors w-full",
              collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="size-8 ring-2 ring-border">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xs">
                  A
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">admin</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={8}
            className="w-56 p-1"
          >
            {/* User info */}
            <div className="px-3 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-2 ring-border">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    A
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">admin</p>
                  <p className="text-xs text-muted-foreground">{siteConfig.author.name}</p>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="py-2.5">
              <Settings size={16} className="mr-2.5 opacity-70" />
              <span>{t("admin.settings") as string}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Theme */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="py-2.5">
                {currentTheme === "light" && <Sun size={16} className="mr-2.5 opacity-70" />}
                {currentTheme === "dark" && <Moon size={16} className="mr-2.5 opacity-70" />}
                {currentTheme === "system" && <Monitor size={16} className="mr-2.5 opacity-70" />}
                <span>{t("admin.theme") as string}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                <DropdownMenuItem onClick={() => setTheme("light")} className="py-2.5">
                  <Sun size={16} className="mr-2.5 opacity-70" />
                  <span>{t("admin.light") as string}</span>
                  {currentTheme === "light" && <Check size={14} className="ml-auto text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="py-2.5">
                  <Moon size={16} className="mr-2.5 opacity-70" />
                  <span>{t("admin.dark") as string}</span>
                  {currentTheme === "dark" && <Check size={14} className="ml-auto text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="py-2.5">
                  <Monitor size={16} className="mr-2.5 opacity-70" />
                  <span>{t("admin.system") as string}</span>
                  {currentTheme === "system" && <Check size={14} className="ml-auto text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Language */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="py-2.5">
                <span className="mr-2.5 text-xs font-bold w-4 text-center opacity-70">
                  {locale === "zh" ? "中" : "EN"}
                </span>
                <span>{t("admin.language") as string}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                {locales.map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLocale(l)} className="py-2.5">
                    <span>{localeLabels[l]}</span>
                    {locale === l && <Check size={14} className="ml-auto text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="py-2.5 text-destructive focus:text-destructive">
              <LogOut size={16} className="mr-2.5 opacity-70" />
              <span>{t("admin.logout") as string}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

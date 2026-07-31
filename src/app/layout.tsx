import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { I18nProvider } from "@/components/layout/i18n-provider"
import { siteConfig } from "@/lib/site-config"
import { defaultLocale } from "@/lib/i18n"
import { getAllTags } from "@bitlog/database"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const tags = await getAllTags()
  const catKeys = ["frontend", "backend", "automator", "components", "gear", "miniprogram", "summary"] as const
  // Only show categories that have matching tags, with post count
  const navCategories = catKeys
    .map((key) => ({
      key,
      count: tags.filter((t) => t.startsWith(key + "-")).length,
    }))
    .filter((c) => c.count > 0)
  // Fallback: if DB empty, show all categories
  const displayCategories = navCategories.length > 0
    ? navCategories
    : catKeys.map((key) => ({ key, count: 0 }))

  return (
    <html
      lang={defaultLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <Header categories={displayCategories} />
            <main className="flex-1">{children}</main>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

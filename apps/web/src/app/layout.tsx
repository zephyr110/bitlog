import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { I18nProvider } from "@/components/layout/i18n-provider"
import { SiteConfigProvider } from "@/components/layout/site-config-provider"
import { DocumentTitle } from "@/components/layout/document-title"
import { getSiteConfig } from "@/lib/get-site-config"
import { defaultLocale } from "@/lib/i18n"
import { getAllTags } from "@bitlog/database"
import { unstable_cache } from "next/cache"
import { Analytics } from "@vercel/analytics/next"
import { categoryKeys } from "@/lib/categories"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig()

  // Resolves relative OG/Twitter image URLs against the real domain —
  // without this Next falls back to localhost. Derived from site.siteUrl
  // (env-only); guarded so a malformed env value can't crash the build.
  let metadataBase: URL | undefined
  try {
    metadataBase = new URL(site.siteUrl)
  } catch {
    metadataBase = undefined
  }

  return {
    metadataBase,
    title: {
      default: site.title,
      // Brand first so tabs read "Zlog | Timeline", not "Timeline | Zlog".
      template: `${site.title} | %s`,
    },
    description: site.description,
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      title: site.title,
      description: site.description,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: site.ogImage,
          width: 1200,
          height: 630,
          alt: site.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
      images: [site.ogImage],
    },
  }
}

// Nav category counts only need to track post writes, not per-request
// freshness — cache so every page load doesn't scan all posts' tags.
const getNavTags = unstable_cache(getAllTags, ["nav-tags"], {
  revalidate: 3600,
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [tags, site] = await Promise.all([getNavTags(), getSiteConfig()])
  // Only show categories that have matching tags, with post count
  const navCategories = categoryKeys
    .map((key) => ({
      key,
      count: tags.filter((t) => t.startsWith(key + "-")).length,
    }))
    .filter((c) => c.count > 0)
  // Fallback: if DB empty, show all categories
  const displayCategories = navCategories.length > 0
    ? navCategories
    : categoryKeys.map((key) => ({ key, count: 0 }))

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
            <SiteConfigProvider value={site}>
              <DocumentTitle />
              <Header categories={displayCategories} />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </SiteConfigProvider>
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

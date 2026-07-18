import { siteConfig } from "@/lib/site-config"
import { getPublishedPosts } from "@/lib/content"

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

export async function GET() {
  const posts = getPublishedPosts()
  const siteUrl = siteConfig.siteUrl.replace(/\/+$/, "")

  const urls = [
    { url: siteUrl, changefreq: "weekly", priority: "1.0", lastmod: new Date().toISOString().slice(0, 10) },
    { url: `${siteUrl}/about`, changefreq: "monthly", priority: "0.8", lastmod: new Date().toISOString().slice(0, 10) },
  ]

  const postUrls = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    lastmod: (post.updated || post.date).slice(0, 10),
    changefreq: "monthly",
    priority: "0.6",
  }))

  const allUrls = [...urls, ...postUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u: { url: string; lastmod: string; changefreq: string; priority: string }) => `  <url>
    <loc>${escapeXml(u.url)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

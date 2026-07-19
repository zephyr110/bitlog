import { siteConfig } from "@/lib/site-config"
import { getPublishedPosts } from "@/lib/content"

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const posts = getPublishedPosts()
  const siteUrl = siteConfig.siteUrl.replace(/\/+$/, "")

  const feedEntries = posts
    .map((post) => {
      const postUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}`
      const published = new Date(post.date).toISOString()
      const updated = new Date(post.updated || post.date).toISOString()

      return `
  <entry>
    <id>${escapeXml(postUrl)}</id>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(postUrl)}" />
    <published>${published}</published>
    <updated>${updated}</updated>
    <summary type="html">${escapeXml(post.description || "")}</summary>
    <content type="html" xml:base="${escapeXml(siteUrl)}">
      <![CDATA[
        <p>${post.description || ""}</p>
        <p><a href="${postUrl}">Read more</a></p>
      ]]>
    </content>
    <author>
      <name>${escapeXml(siteConfig.author.name)}</name>
    </author>
    ${post.tags.map((tag) => `<category term="${escapeXml(tag)}" />`).join("\n    ")}
  </entry>`
    })
    .join("")

  const atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.title)}</title>
  <subtitle>${escapeXml(siteConfig.description)}</subtitle>
  <link href="${escapeXml(siteUrl)}/feed.xml" rel="self" />
  <link href="${escapeXml(siteUrl)}" />
  <updated>${posts.length > 0 ? new Date(posts[0].date).toISOString() : new Date().toISOString()}</updated>
  <id>${escapeXml(siteUrl)}/</id>
  <author>
    <name>${escapeXml(siteConfig.author.name)}</name>
  </author>
  ${feedEntries}
</feed>`

  return new Response(atomFeed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  })
}

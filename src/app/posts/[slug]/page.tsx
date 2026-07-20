import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getPostBySlug, getPublishedPosts } from "@/lib/content"
import { siteConfig } from "@/lib/site-config"
import { defaultLocale, t } from "@/lib/i18n"
import { MDXRenderer } from "@/components/blog/mdx-renderer"
import { TagBadge } from "@/components/blog/tag-badge"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { FormattedDate } from "@/components/blog/formatted-date"
import { CopyLinkButton } from "@/components/blog/share-buttons"
import { CommentSection } from "@/components/blog/comment-section"
import { Trans } from "@/components/layout/trans"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock } from "lucide-react"

const ogImageUrl = (path: string) =>
  path.startsWith("http") ? path : `${siteConfig.siteUrl}${path}`

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: t(defaultLocale, "site.notFound") as string }

  const postImage = post.cover
    ? ogImageUrl(post.cover)
    : `${siteConfig.siteUrl}${siteConfig.ogImage}`

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [postImage],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post || post.draft) notFound()

  const relatedPosts = getPublishedPosts()
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3)

  return (
    <>
      <ReadingProgress />

      <article className="min-h-screen">
        {/* Hero Header */}
        <header className="relative border-b bg-muted/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />
          {post.cover && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </>
          )}

          <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl relative">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground/70 truncate max-w-[200px]">
                {post.title}
              </span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-500">
              {post.title}
            </h1>

            {/* Description */}
            {post.description && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {post.description}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground animate-in fade-in duration-700">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    A
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {siteConfig.author.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar size={12} />
                    <FormattedDate date={post.date} />
                    <span className="opacity-40">·</span>
                    <Clock size={12} />
                    <span>
                      <Trans k="post.minRead" args={[post.readingTime]} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <>
                  <span className="hidden md:block opacity-20">|</span>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <TagBadge
                        key={tag}
                        tag={tag}
                        href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Share */}
              <div className="ml-auto flex items-center gap-1">
                <CopyLinkButton url={`/posts/${encodeURIComponent(post.slug)}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
          <div className="prose dark:prose-invert prose-lg max-w-none
            prose-headings:scroll-mt-20
            prose-p:leading-relaxed prose-p:my-5
            prose-strong:text-foreground prose-strong:font-semibold
            prose-li:my-1.5
            prose-img:rounded-xl prose-img:shadow-md
            prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:!border-0">
            <MDXRenderer post={post} />
          </div>

          {/* Post Footer */}
          <Separator className="my-12" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton
                url={`/posts/${encodeURIComponent(post.slug)}`}
              />
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t bg-muted/10">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
              <h2 className="text-2xl font-bold mb-8">
                <Trans k="post.relatedPosts" />
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/posts/${encodeURIComponent(rp.slug)}`}
                    className="group block p-4 rounded-xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {rp.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5">
                      <Calendar size={10} />
                      <FormattedDate date={rp.date} month="short" />
                      <span>·</span>
                      <Clock size={10} />
                      <Trans k="post.minRead" args={[rp.readingTime]} />
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to top */}
        <div className="text-center py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trans k="site.backToPosts" />
          </Link>
        </div>
      </article>
    </>
  )
}

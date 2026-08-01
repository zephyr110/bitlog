import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getPostsByCategory, getAllTags } from "@bitlog/database"
import { PostCard } from "@/components/blog/post-card"
import { Trans } from "@/components/layout/trans"
import { defaultLocale, t } from "@/lib/i18n"
import { categoryMeta, categoryKeys, type CategoryKey } from "@/lib/categories"

interface CategoryPageProps {
  params: Promise<{ name: string }>
}

const knownCategories = categoryKeys as unknown as string[]

export async function generateStaticParams() {
  return knownCategories.map((name) => ({ name }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params
  const meta = categoryMeta[name as CategoryKey]
  if (!meta) return { title: t(defaultLocale, "site.notFound") as string }
  return { title: t(defaultLocale, meta.i18nKey) as string, description: meta.desc }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params
  const meta = categoryMeta[name as CategoryKey]
  if (!meta) notFound()

  const [posts, allTags] = await Promise.all([
    getPostsByCategory(name),
    getAllTags(),
  ])

  const subTags = allTags
    .filter((t) => t.startsWith(name + "-"))
    .sort()
  const label = t(defaultLocale, meta.i18nKey) as string
  const Icon = meta.icon

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl 2xl:max-w-7xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium">{label}</span>
            </nav>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{label}</h1>
                <p className="text-sm text-muted-foreground mt-1">{meta.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span>{(t(defaultLocale, "site.postsCount") as (n: number) => string)(posts.length)}</span>
              {subTags.length > 0 && (
                <span>{(t(defaultLocale, "category.tagsCount") as (n: number) => string)(subTags.length)}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 max-w-5xl 2xl:max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {knownCategories.map((c) => {
            const cm = categoryMeta[c as CategoryKey]
            if (!cm) return null
            const isActive = c === name
            return (
              <Link
                key={c}
                href={`/category/${encodeURIComponent(c)}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/25 hover:bg-primary/[0.04]"
                }`}
              >
                {t(defaultLocale, cm.i18nKey) as string}
              </Link>
            )
          })}
        </div>

        {subTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60 mr-1">
              {t(defaultLocale, "category.tagsLabel") as string}:
            </span>
            {subTags.map((st) => {
              const short = st.slice(name.length + 1)
              return (
                <Link
                  key={st}
                  href={`/tags/${encodeURIComponent(st)}`}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-mono"
                >
                  {short}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-5xl 2xl:max-w-7xl">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Icon size={28} className="text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {t(defaultLocale, "category.empty") as string}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t(defaultLocale, "category.emptyDesc") as string}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <div
                key={post.slug}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDuration: "500ms",
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: "both",
                }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

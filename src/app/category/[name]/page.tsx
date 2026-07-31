import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getAllCategories, getPostsByCategory } from "@bitlog/database"
import { PostCard } from "@/components/blog/post-card"
import { Trans } from "@/components/layout/trans"

interface CategoryPageProps {
  params: Promise<{ name: string }>
}

const categoryLabels: Record<string, string> = {
  frontend: "前端",
  backend: "后端",
  automator: "自动化",
  components: "组件",
  gear: "工具",
  miniprogram: "小程序",
  summary: "总结",
}

export async function generateStaticParams() {
  try {
    const cats = await getAllCategories()
    if (cats.length > 0) {
      return cats.map((name) => ({ name }))
    }
  } catch {
    // DB unreachable or empty — no category pages to generate
  }
  // Next.js static export requires at least one path
  return [{ name: "_fallback" }]
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params
  const label = categoryLabels[name] || name
  return {
    title: label,
    description: `${label} 分类下的所有文章`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params
  const cats = await getAllCategories()

  if (!cats.includes(name)) notFound()

  const posts = await getPostsByCategory(name)
  const label = categoryLabels[name] || name

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-4xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium">{label}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {label}
            </h1>
            <p className="text-muted-foreground">
              {posts.length} 篇文章
            </p>
          </div>
        </div>
      </section>

      {/* Category bar */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          {cats.map((c) => {
            const isActive = c === name
            return (
              <Link
                key={c}
                href={`/category/${encodeURIComponent(c)}`}
                className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {categoryLabels[c] || c}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Posts */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-semibold mb-2">暂无文章</h2>
            <p className="text-muted-foreground">该分类下还没有文章。</p>
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

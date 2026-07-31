import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getPostsByCategory, getAllTags } from "@bitlog/database"
import { PostCard } from "@/components/blog/post-card"
import { Trans } from "@/components/layout/trans"
import { Monitor, Server, Bot, Package, Wrench, Smartphone, FileText } from "lucide-react"

interface CategoryPageProps {
  params: Promise<{ name: string }>
}

const categoryMeta: Record<string, { label: string; desc: string; icon: typeof Monitor }> = {
  frontend: { label: "前端", desc: "JavaScript · CSS · React · Vue · TypeScript", icon: Monitor },
  backend: { label: "后端", desc: "Python · MySQL · Nginx · Linux", icon: Server },
  automator: { label: "自动化", desc: "Appium · Jest · 测试框架", icon: Bot },
  components: { label: "组件", desc: "NPM 发布 · UI 组件 · 工具库", icon: Package },
  gear: { label: "工具", desc: "Git · Webpack · VSCode · Terminal", icon: Wrench },
  miniprogram: { label: "小程序", desc: "微信小程序开发", icon: Smartphone },
  summary: { label: "总结", desc: "笔记 · 踩坑记录 · 思考与复盘", icon: FileText },
}
const knownCategories = Object.keys(categoryMeta)

export async function generateStaticParams() {
  // Use known categories — getAllCategories() depends on DB which may be empty at build
  return knownCategories.map((name) => ({ name }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params
  const meta = categoryMeta[name]
  if (!meta) return { title: "未找到" }
  return { title: meta.label, description: meta.desc }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params
  const meta = categoryMeta[name]
  if (!meta) notFound()

  const [posts, allTags] = await Promise.all([
    getPostsByCategory(name),
    getAllTags(),
  ])

  // Sub-tags within this category (e.g. frontend-css, frontend-js)
  const subTags = allTags
    .filter((t) => t.startsWith(name + "-"))
    .sort()

  const label = meta.label
  const Icon = meta.icon

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-4xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium">{label}</span>
            </nav>

            {/* Icon + title row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {label}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{meta.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span>{posts.length} 篇文章</span>
              {subTags.length > 0 && (
                <span>{subTags.length} 个子分类</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category switcher + sub-tags */}
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2">
          {knownCategories.map((c) => {
            const cm = categoryMeta[c]
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
                {cm.label}
              </Link>
            )
          })}
        </div>

        {/* Sub-tags within this category */}
        {subTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60 mr-1">子分类:</span>
            {subTags.map((st) => {
              const short = st.slice(name.length + 1) // "frontend-css" → "css"
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

      {/* Posts grid */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Icon size={28} className="text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">暂无文章</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              该分类下还没有文章，请稍后再来。
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

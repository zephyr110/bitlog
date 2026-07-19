import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/lib/site-config"
import { Trans } from "@/components/layout/trans"
import { GitBranch, MessageCircle, Sparkles, Palette, Code2, FileCode, Cloud, Rocket } from "lucide-react"

const techStack = [
  {
    name: "Next.js 16",
    desc: "Static site generation with App Router",
    icon: Rocket,
  },
  {
    name: "shadcn/ui",
    desc: "Beautiful, accessible UI components",
    icon: Sparkles,
  },
  {
    name: "Tailwind CSS",
    desc: "Utility-first responsive styling",
    icon: Palette,
  },
  {
    name: "MDX",
    desc: "Rich content with Markdown + JSX",
    icon: FileCode,
  },
  {
    name: "GitHub Pages",
    desc: "Free, reliable static hosting",
    icon: Cloud,
  },
  {
    name: "GitHub Actions",
    desc: "Automated build and deployment",
    icon: Code2,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <Trans k="about.title" />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              <Trans k="about.description" />
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl space-y-16">
        {/* About Me */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">
            <Trans k="about.aboutMe" />
          </h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              <Trans k="about.aboutMeContent" />
            </p>
            <p>
              <Trans k="about.aboutMeContent2" />
            </p>
          </div>
        </section>

        <Separator />

        {/* Tech Stack */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-2">
            <Trans k="about.techStack" />
          </h2>
          <p className="text-muted-foreground mb-8">
            <Trans k="about.techStackDesc" />
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech) => {
              const Icon = tech.icon
              return (
                <div
                  key={tech.name}
                  className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{tech.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tech.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <Separator />

        {/* Contact */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">
            <Trans k="about.contact" />
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <Trans k="about.contactDesc" />
          </p>
          <div className="flex gap-3">
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted hover:border-primary/20 transition-all text-sm font-medium"
            >
              <GitBranch size={16} />
              <Trans k="about.github" />
            </a>
            <a
              href={siteConfig.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted hover:border-primary/20 transition-all text-sm font-medium"
            >
              <MessageCircle size={16} />
              <Trans k="about.twitter" />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

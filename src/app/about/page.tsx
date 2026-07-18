import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/lib/site-config"
import { Globe, MessageCircle } from "lucide-react"

const techStack = [
  {
    name: "Next.js 16",
    desc: "Static site generation with App Router",
    icon: "N",
  },
  {
    name: "shadcn/ui",
    desc: "Beautiful, accessible UI components",
    icon: "S",
  },
  {
    name: "Tailwind CSS",
    desc: "Utility-first responsive styling",
    icon: "T",
  },
  {
    name: "MDX",
    desc: "Rich content with Markdown + JSX",
    icon: "M",
  },
  {
    name: "GitHub Pages",
    desc: "Free, reliable static hosting",
    icon: "G",
  },
  {
    name: "GitHub Actions",
    desc: "Automated build and deployment",
    icon: "A",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              About
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              The story behind this blog and the technology that powers it.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl space-y-16">
        {/* About Me */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">About Me</h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>
              Hi! I&apos;m the author of this blog. I write about technology,
              programming, and whatever else catches my interest. This blog is
              my space to share thoughts, document learnings, and connect with
              others who share similar interests.
            </p>
            <p>
              When I&apos;m not writing, you can find me exploring new
              technologies, contributing to open-source projects, or enjoying a
              good cup of coffee.
            </p>
          </div>
        </section>

        <Separator />

        {/* Tech Stack */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-2">Tech Stack</h2>
          <p className="text-muted-foreground mb-8">
            This blog is built with modern tools, designed to be fast and
            maintainable.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {tech.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{tech.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tech.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Contact */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Have a question, suggestion, or just want to say hi? Feel free to
            reach out. I&apos;m always open to interesting conversations and
            collaborations.
          </p>
          <div className="flex gap-3">
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-10 rounded-lg border hover:bg-muted transition-colors"
              title="GitHub"
            >
              <Globe size={18} />
            </a>
            <a
              href={siteConfig.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-10 rounded-lg border hover:bg-muted transition-colors"
              title="X (Twitter)"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

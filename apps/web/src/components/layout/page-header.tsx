import Link from "next/link"
import type { ReactNode } from "react"
import { Container } from "@/components/ui/container"

interface BreadcrumbItem {
  href: string
  label: ReactNode
}

interface PageHeaderProps {
  title: ReactNode
  /** Breadcrumb trail; the last item is rendered as the current page. */
  breadcrumb?: BreadcrumbItem[]
  description?: ReactNode
  /** Extra content on the right side of the title row (actions, counts). */
  actions?: ReactNode
  children?: ReactNode
}

/** Shared page hero: breadcrumb + title + description on a tinted band. */
export function PageHeader({
  title,
  breadcrumb,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative border-b bg-muted/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
      <Container size="lg" className="relative">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
            >
              {breadcrumb.map((item, i) => (
                <span key={`${item.href}-${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="opacity-40">/</span>}
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-foreground font-medium">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>

          {children}
        </div>
      </Container>
    </section>
  )
}

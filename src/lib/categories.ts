import { Monitor, Server, Bot, Package, Wrench, Smartphone, FileText } from "lucide-react"

export const categoryKeys = [
  "frontend", "backend", "automator", "components", "gear", "miniprogram", "summary",
] as const

export type CategoryKey = (typeof categoryKeys)[number]

export const categoryMeta: Record<CategoryKey, { i18nKey: string; desc: string; icon: typeof Monitor }> = {
  frontend: { i18nKey: "cat.frontend", desc: "JavaScript · CSS · React · Vue · TypeScript", icon: Monitor },
  backend:  { i18nKey: "cat.backend", desc: "Python · MySQL · Nginx · Linux", icon: Server },
  automator: { i18nKey: "cat.automator", desc: "Appium · Jest · Testing", icon: Bot },
  components: { i18nKey: "cat.components", desc: "NPM · UI Components", icon: Package },
  gear: { i18nKey: "cat.gear", desc: "Git · Webpack · VSCode · Terminal", icon: Wrench },
  miniprogram: { i18nKey: "cat.miniprogram", desc: "WeChat Mini Program", icon: Smartphone },
  summary: { i18nKey: "cat.summary", desc: "Notes · Tips · Reflections", icon: FileText },
}

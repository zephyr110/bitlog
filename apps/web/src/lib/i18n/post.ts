// post — zh/en translation dictionary (split by domain)

export const post = {
  zh: {

minRead: (n: number) => `${n} 分钟`,
comments: "评论",
commentsNotConfigured: "评论功能尚未配置",
commentsDisabledDev: "本地开发环境下评论区已停用，生产环境正常显示。",
commentsDisabledInsecure: "在不安全的 http 连接下评论区已停用，请通过 https 访问。",
configureGiscus: "要启用 Giscus 评论，请配置以下环境变量：",
getValuesAt: "在 giscus.app 获取这些值",
relatedPosts: "相关文章",
shareOnX: "分享到 X",
copyLink: "复制链接",
linkCopied: "链接已复制！",
copyFailed: "复制失败",
copyCode: "复制代码",
codeCopied: "已复制！",
mermaidError: "图表渲染失败，以下是原始 mermaid 源码：",
tagsLabel: "标签",
chars: (n: number) => `${n} 字`,
words: (n: number) => `${n} 词`,
readTime: (n: number) => `约 ${n} 分钟`,
shortDate: (d: Date) =>
  d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // UTC calendar date — without this the static-exported HTML (built
    // in one timezone) would differ from the hydrated client render.
    timeZone: "UTC",
  }),
    
  },
  en: {

minRead: (n: number) => `${n} min`,
comments: "Comments",
commentsNotConfigured: "Comments are not configured",
commentsDisabledDev: "Comments are disabled in local development; they work normally in production.",
commentsDisabledInsecure: "Comments are disabled on insecure (http) connections — please use https.",
configureGiscus: "To enable Giscus comments, configure the following environment variables:",
getValuesAt: "Get these values at giscus.app",
relatedPosts: "Related Posts",
shareOnX: "Share on X",
copyLink: "Copy link",
linkCopied: "Link copied!",
copyFailed: "Failed to copy",
copyCode: "Copy code",
codeCopied: "Copied!",
mermaidError: "Diagram failed to render — raw mermaid source below:",
tagsLabel: "Tags",
chars: (n: number) => `${n} chars`,
words: (n: number) => `${n} words`,
readTime: (n: number) => `~${n} min`,
shortDate: (d: Date) =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // UTC calendar date — without this the static-exported HTML (built
    // in one timezone) would differ from the hydrated client render.
    timeZone: "UTC",
  }),
    
  },
} as const

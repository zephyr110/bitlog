// post — zh/en translation dictionary (split by domain)

export const post = {
  zh: {

minRead: (n: number) => `${n} 分钟`,
comments: "评论",
commentsCount: (n: number) => `评论 (${n})`,
commentAuthorPlaceholder: "昵称",
commentEmailPlaceholder: "邮箱（可选）",
commentContentPlaceholder: "写下你的评论…",
commentSubmit: "发表评论",
commentSubmitting: "发布中…",
commentEmpty: "还没有评论，来抢沙发",
commentClosed: "评论已关闭",
commentNotConfigured: "评论功能尚未配置，请稍后再试",
commentEmailNote: "邮箱仅用于联系，不会公开显示",
commentErrorTooFast: "提交过快，请稍后再试",
commentErrorRateLimited: "评论过于频繁，请稍后再试",
commentErrorInvalid: "评论内容不符合要求",
commentErrorSessionExpired: "会话已过期，请重新提交",
commentErrorServiceUnavailable: "评论服务暂时不可用，请稍后再试",
commentErrorClosed: "评论已关闭",
commentErrorFailed: "提交失败，请重试",
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
commentsCount: (n: number) => `Comments (${n})`,
commentAuthorPlaceholder: "Name",
commentEmailPlaceholder: "Email (optional)",
commentContentPlaceholder: "Write a comment…",
commentSubmit: "Post comment",
commentSubmitting: "Posting…",
commentEmpty: "No comments yet — be the first!",
commentClosed: "Comments are closed",
commentNotConfigured: "Comments are not configured yet — please try again later",
commentEmailNote: "Your email is only used for contact and never shown publicly",
commentErrorTooFast: "Submitted too quickly — please try again",
commentErrorRateLimited: "Too many comments — please slow down",
commentErrorInvalid: "Comment does not meet the requirements",
commentErrorSessionExpired: "Session expired — please submit again",
commentErrorServiceUnavailable: "Comments are temporarily unavailable — please try again later",
commentErrorClosed: "Comments are closed",
commentErrorFailed: "Failed to post — please retry",
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

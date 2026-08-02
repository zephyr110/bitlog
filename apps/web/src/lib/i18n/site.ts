// site — zh/en translation dictionary (split by domain)

export const site = {
  zh: {

heroTitleLine1: "思考、故事",
heroTitleLine2: "和想法。",
heroSubtitle:
  "一个探索技术、编程和构建 Web 的个人空间。",
articlesPublished: (n: number) => `${n} 篇文章`,
browsePosts: "浏览文章",
loading: "加载中...",
backToPosts: "← 返回文章列表",
notFound: "未找到",
noPosts: "暂无文章",
noPostsDesc: "第一篇文章即将发布，敬请期待。",
topics: "分类",
clearFilter: "清除筛选",
noMatchPosts: "没有匹配的文章",
noMatchPostsDesc: (tag: string) =>
  `没有标记为「${tag}」的文章，请尝试选择其他主题。`,
postsCount: (n: number) => `${n} 篇文章`,
postsTagged: (tag: string) => `标签为「${tag}」的文章`,
postsTaggedDesc: (tag: string) => `所有标记为「${tag}」的博客文章。`,
home: "首页",
about: "关于",
navigate: "导航",
links: "链接",
searchPosts: "搜索文章...",
noTopics: "暂无分类",
timeline: "时间轴",
    
  },
  en: {


heroTitleLine1: "Thoughts, stories",
heroTitleLine2: "and ideas.",
heroSubtitle:
  "A personal space for exploring technology, programming, and the craft of building things on the web.",
articlesPublished: (n: number) =>
  `${n} ${n === 1 ? "article" : "articles"}`,
browsePosts: "Browse articles",
loading: "Loading...",
backToPosts: "← Back to all posts",
notFound: "Not Found",
noPosts: "No posts yet",
noPostsDesc: "The first article is on its way. Check back soon.",
topics: "Topics",
clearFilter: "Clear filter",
noMatchPosts: "No matching posts",
noMatchPostsDesc: (tag: string) =>
  `No posts tagged with "${tag}". Try selecting a different topic.`,
postsCount: (n: number) => `${n} ${n === 1 ? "post" : "posts"}`,
postsTagged: (tag: string) => `Posts tagged "${tag}"`,
postsTaggedDesc: (tag: string) => `All blog posts tagged with "${tag}".`,
home: "Home",
about: "About",
navigate: "Navigate",
links: "Links",
searchPosts: "Search posts...",
noTopics: "No topics",
timeline: "Timeline",
    
  },
} as const

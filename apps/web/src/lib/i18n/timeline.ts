// timeline — zh/en translation dictionary (split by domain)

export const timeline = {
  zh: {

title: "时间轴",
description: "按时间顺序浏览所有文章",
total: (n: number) => `共 ${n} 篇文章`,
postsCount: (n: number) => `${n} 篇`,
empty: "暂无文章",
month: (m: string) => parseInt(m) + "月",
    
  },
  en: {

title: "Timeline",
description: "Browse all articles in chronological order",
total: (n: number) => `${n} articles in total`,
postsCount: (n: number) => `${n} posts`,
empty: "No articles yet",
month: (m: string) => ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)] || m,
    
  },
} as const

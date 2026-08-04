// archive — zh/en translation dictionary (split by domain)

export const archive = {
  zh: {

title: "归档",
description: "全部文章，按年份分组。",
total: (n: number) => `共 ${n} 篇文章`,

  },
  en: {

title: "Archive",
description: "Every article, grouped by year.",
total: (n: number) => `${n} ${n === 1 ? "article" : "articles"} in total`,

  },
} as const

// category — zh/en translation dictionary (split by domain)

export const category = {
  zh: {

empty: "暂无文章",
emptyDesc: "该分类下还没有文章。",
tagsCount: (n: number) => `${n} 个标签`,
tagsLabel: "标签",
    
  },
  en: {

empty: "No articles yet",
emptyDesc: "There are no articles in this category.",
tagsCount: (n: number) => `${n} tags`,
tagsLabel: "Tags",
    
  },
} as const

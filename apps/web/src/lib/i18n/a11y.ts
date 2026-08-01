// a11y — accessibility labels (zh/en)

export const a11y = {
  zh: {

linkToHeading: "链接到标题",
linkTo: (title: string) => `链接到 ${title}`,
    
  },
  en: {

linkToHeading: "Link to heading",
linkTo: (title: string) => `Link to ${title}`,
    
  },
} as const

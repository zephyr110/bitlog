export interface PostFrontmatter {
  title: string
  slug: string
  date: string
  updated?: string
  tags: string[]
  description: string
  cover?: string
  draft: boolean
}

export interface Post {
  slug: string
  title: string
  date: string
  updated?: string
  tags: string[]
  description: string
  cover?: string
  draft: boolean
  content: string
  wordCount: number
  readingTime: number
}

export interface PostSummary {
  slug: string
  title: string
  date: string
  updated?: string
  tags: string[]
  description: string
  cover?: string
  draft: boolean
  wordCount: number
  readingTime: number
}

export interface LoginInput {
  username: string
  password: string
}

export interface AuthUser {
  username: string
}

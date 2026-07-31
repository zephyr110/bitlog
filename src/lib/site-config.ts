export const siteConfig = {
  name: "BitLog",
  title: "BitLog",
  description:
    "A personal blog about technology, programming, and more.",
  author: {
    name: "Admin",
    avatar: "/images/avatar.jpg",
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage:
    process.env.NEXT_PUBLIC_OG_IMAGE || "/images/og-default.jpg",
  social: {
    github: "https://github.com/zephyr110/bitlog",
    twitter: "https://twitter.com",
  },
} as const

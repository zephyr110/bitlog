# BitLog

A minimal, fast, and bilingual personal blog built with [Next.js](https://nextjs.org) App Router, [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), and [MDX](https://mdxjs.com).

BitLog is designed for developers who want a clean writing experience with a lightweight CMS that runs locally. Write posts in Markdown/MDX, manage them through the admin panel, and deploy a fully static site.

## Features

- **Static Site Generation** — Pre-rendered pages for performance and SEO.
- **Local Admin CMS** — Write, edit, publish, and delete posts from `/admin`.
- **MDX Content** — Rich Markdown with syntax-highlighted code blocks, tables, and frontmatter.
- **Bilingual** — Built-in English / 中文 support with language switching.
- **Dark Mode** — System-aware light/dark theme toggle.
- **Giscus Comments** — GitHub Discussions-powered comments (optional).
- **Auto-generated SEO** — Sitemap, RSS feed, Open Graph, and Twitter cards.
- **Tag-based Navigation** — Browse posts by tags.
- **Reading Stats** — Word count and estimated reading time for every post.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **UI Primitives:** @base-ui/react
- **Content:** MDX via `next-mdx-remote`, `gray-matter`, `rehype-pretty-code`
- **Auth:** JWT (`jose`) + bcryptjs
- **Charts:** Recharts
- **Icons:** Lucide React
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Environment Variables

Copy the example file and update the values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `ADMIN_USERNAME` | Username for the admin panel |
| `ADMIN_PASSWORD_HASH` | Base64-encoded bcrypt hash of the admin password |
| `SESSION_SECRET` | Random secret for signing JWT tokens |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site |

Generate a password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(h => console.log(Buffer.from(h).toString('base64')))"
```

Optional Giscus variables for comments:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GISCUS_REPO` | `owner/repo` |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | From giscus.app |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | Discussion category name |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | From giscus.app |

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the blog and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the CMS.

## Admin Panel

- Log in with the credentials configured in `.env.local`.
- Create and edit posts in Markdown/MDX.
- Save drafts with `Ctrl/Cmd + S`.
- Publish/unpublish posts or delete them from the post list.
- Upload images via the media library (`/admin/media`).

## Content

Posts live in `content/posts/` as `.mdx` files. Drafts are stored in `content/drafts/`.

Example frontmatter:

```yaml
---
title: "My First Post"
slug: "my-first-post"
date: "2026-07-19"
tags: ["nextjs", "blog"]
description: "A short description for SEO and previews."
draft: false
---
```

Code blocks support syntax highlighting and a copy button:

````markdown
```typescript
const greeting = "Hello, BitLog!"
```
````

## Deployment

### Static Export (recommended for GitHub Pages / CDN)

```bash
pnpm export
```

This generates a static site in `out/`.

### Vercel / Node Server

```bash
pnpm build
```

Then start the production server with `pnpm start` or deploy the build output to your platform.

## Project Structure

```
bitlog/
├── content/              # MDX posts and drafts
├── public/               # Static assets
├── scripts/              # Build helpers
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── admin/        # Admin UI components
│   │   ├── blog/         # Blog rendering components
│   │   ├── layout/       # Header, theme, i18n
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities, auth, content API
│   └── types/            # TypeScript types
├── .env.local.example    # Environment variable template
├── next.config.ts
├── package.json
└── README.md
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm export` | Build static export |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Customization

- Edit `src/lib/site-config.ts` to change site name, author, and social links.
- Update `src/lib/i18n.ts` to add or modify translations.
- Adjust `src/app/globals.css` for theme colors and scrollbar styles.

## License

MIT

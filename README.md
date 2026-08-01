# BitLog

A minimal, fast, and bilingual personal blog built with [Next.js](https://nextjs.org) App Router, [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [MDX](https://mdxjs.com), and [Turso](https://turso.tech).

BitLog is designed for developers who want a clean writing experience with a lightweight CMS that runs locally. Write posts in Markdown/MDX, manage them through the admin panel, and deploy a fully static site.

## Features

- **Static Site Generation** — Pre-rendered pages for performance and SEO.
- **Local Admin CMS** — Write, edit, publish, and delete posts from `/admin`.
- **Database-Backed** — Posts stored in Turso (libSQL), an edge-distributed SQLite database.
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
- **Content:** MDX via `next-mdx-remote`, `rehype-pretty-code`
- **Database:** Turso (libSQL) + `@libsql/client`
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
| `TURSO_DATABASE_URL` | Turso/libSQL database URL (use `file:./bitlog.db` for local dev) |
| `TURSO_AUTH_TOKEN` | Turso auth token (only needed for remote databases) |
| `ADMIN_USERNAME` | Initial admin username — used only to seed the `users` table on first login; can be removed afterwards |
| `ADMIN_PASSWORD_HASH` | Base64-encoded bcrypt hash of the initial admin password — used only to seed the `users` table; can be removed afterwards |
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

### Database Setup

BitLog uses Turso (libSQL) for content storage and admin credentials. For local development without a Turso Cloud account, use a local SQLite file — set `TURSO_DATABASE_URL=file:./bitlog.db` in `.env.local`. The table schema is created automatically on first request.

The `users` table stores the admin account (bcrypt hash). On the first login, the table is seeded from `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`. Changing the password later updates the database (not the env file), so password changes work on Vercel and any serverless deployment. The database is the single source of truth for credentials — once the first user is seeded, the env variables are no longer needed.

To create or reset an admin user without the env variables (e.g. on a fresh deployment):

```bash
pnpm create-admin --username admin --password "your-password"
```

Existing JWTs are invalidated when the password changes.

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

Posts are stored in a Turso (libSQL) database. A post's metadata (title, date, tags, etc.) is stored as columns in the `posts` table, while the Markdown body is stored in the `content` column and rendered via MDX at runtime.

Example frontmatter (stored as database columns):

```yaml
---
title: "My First Post"
slug: "my-first-post"
date: "2026-07-19"
tags: ["frontend-nextjs", "frontend-blog"]
description: "A short description for SEO and previews."
---
```

Tags use a `{category}-{topic}` format for automatic category grouping.

Code blocks support syntax highlighting and a copy button:

````markdown
```typescript
const greeting = "Hello, BitLog!"
```
````

## Deployment

### GitHub Pages

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on every push to `main`.

**Setup steps:**

1. Fork or push this repo to your GitHub account.
2. Create a Turso database (see [Turso docs](https://docs.turso.tech)) and run `pnpm migrate` to populate it.
3. In your target GitHub Pages repo, go to **Settings → Secrets and variables → Actions** and add:
   - `GH_PAT`: A [personal access token](https://github.com/settings/tokens) with `repo` scope.
   - `TURSO_DATABASE_URL`: Your Turso database URL (`libsql://...`).
   - `TURSO_AUTH_TOKEN`: Your Turso auth token.
4. Update `.github/workflows/deploy.yml`:
   - Change `external_repository` to `your-username/your-username.github.io`.
5. Set the `NEXT_PUBLIC_SITE_URL` env var in the workflow to your Pages URL.
6. Optionally configure `NEXT_PUBLIC_GISCUS_*` vars in the workflow for comments.
7. Push to `main` — the workflow builds and deploys automatically.

**Manual static export:**

```bash
pnpm export
```

This generates a static site in `out/` that you can deploy to any static host.

### Vercel

1. Import the repo into [Vercel](https://vercel.com).
2. Set the **Build Command** to `pnpm build` (NOT `pnpm export`).
3. Set the **Output Directory** to `.next` (Vercel default).
4. Add environment variables in Vercel's project settings:
   - `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — Turso database connection.
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` for admin auth.
   - `NEXT_PUBLIC_SITE_URL` — your Vercel domain.
   - `NEXT_PUBLIC_GISCUS_*` — if using Giscus comments.
5. Deploy. The admin panel at `/admin/login` will work on Vercel since it runs a Node server.

> **Note:** Static export (`pnpm export`) strips the admin API — use it only for GitHub Pages. Vercel/Node hosting preserves the full admin CMS.

## Project Structure

```
bitlog/
├── public/               # Static assets
├── scripts/              # Build helpers
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── admin/        # Admin UI components
│   │   ├── blog/         # Blog rendering components
│   │   ├── layout/       # Header, theme, i18n
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities, auth, content API, DB
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

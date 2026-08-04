# Zlog

A minimal, fast, and bilingual personal blog with a local admin CMS. Built with [Next.js](https://nextjs.org) 16 (App Router), [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com), [MDX](https://mdxjs.com), and [Turso](https://turso.tech) (libSQL). Deploys as a fully static site.

Live: [zephyr110.vercel.app](https://zephyr110.vercel.app)

Static mirror: [zephyr110.github.io](https://zephyr110.github.io)

<img width="1440" height="2064" alt="zephyr110 vercel app_about (2)" src="https://github.com/user-attachments/assets/00d57a80-7806-4532-92ac-e12751966dd8" />
<img width="1440" height="2064" alt="zephyr110 vercel app_about (1) (1)" src="https://github.com/user-attachments/assets/954808c2-c12e-47eb-85b5-8023a65791fc" />

## Features

- **Static blog** — pre-rendered pages for performance and SEO; sitemap, RSS, and Open Graph built in
- **Local admin CMS** — write, edit, publish, and delete posts from `/admin`
- **Hardened auth** — bcrypt (cost 12) + JWT, login-failure lockout, recovery key
- **Media library** — auto WebP compression, Turso storage + GitHub/jsdelivr CDN dual-write
- **Custom logo & favicon** — upload your own logo in Site Settings; the favicon follows it automatically
- **Bilingual & themable** — zh/en switching, light/dark/system themes
- **Giscus comments** — GitHub Discussions powered (optional)

## Architecture

pnpm workspace monorepo:

| Package | Role |
|---------|------|
| `apps/web` | Next.js app — static blog pages + client-side admin panel |
| `packages/database` | Turso (libSQL) access — posts, media, settings, users, auth lockout |
| `packages/auth` | Credential verification, JWT sessions, login lockout |
| `packages/core` | Shared domain logic — MDX utilities, types |

The blog renders fully statically (`output: export`); CI deploys it to GitHub Pages on every push to `main`. The admin CMS runs locally with `pnpm dev` (API routes are excluded from static exports). On Vercel the same codebase serves the admin CMS server-side.

## Getting Started

### Prerequisites

Node.js 20+ · pnpm 9+

### Install & run

```bash
pnpm install
cd apps/web && cp .env.local.example .env.local   # fill in the values
pnpm dev          # blog at :3000, admin at /admin/login
```

Key env vars: `TURSO_DATABASE_URL` (use `file:./zlog.db` for local dev), `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (seed the admin user on first login), `NEXT_PUBLIC_SITE_URL`, and optional `NEXT_PUBLIC_GISCUS_*` for comments.

Create or reset the admin user without env vars:

```bash
pnpm create-admin --username admin --password "your-password"
```

### Build & deploy

```bash
pnpm export      # static export to apps/web/out
```

Push to `main` → GitHub Actions builds and deploys to GitHub Pages automatically. For Vercel/Node hosting, use `pnpm build` instead — the admin CMS then runs server-side. See the [deployment guide](https://zephyr110.vercel.app/posts/zlog-deployment-guide) for step-by-step instructions.

## License

MIT

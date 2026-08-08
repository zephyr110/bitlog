# Zlog

English | [简体中文](./README.zh-CN.md)

A minimal, fast, and bilingual personal blog with a local admin CMS. Built with [Next.js](https://nextjs.org) 16 (App Router), [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com), [MDX](https://mdxjs.com), and [Turso](https://turso.tech) (libSQL). One codebase, two deployment targets — both read posts from the same Turso database.

Live (Vercel): [zephyr110.vercel.app](https://zephyr110.vercel.app)

Static mirror (GitHub Pages): [zephyr110.github.io](https://zephyr110.github.io)

<img width="1440" height="2064" alt="zephyr110 vercel app_about (2)" src="https://github.com/user-attachments/assets/00d57a80-7806-4532-92ac-e12751966dd8" />
<img width="1440" height="2064" alt="zephyr110 vercel app_about (1) (1)" src="https://github.com/user-attachments/assets/954808c2-c12e-47eb-85b5-8023a65791fc" />

## Features

- **Two deploy targets** — Vercel (SSR + admin) and GitHub Pages (static export); Turso is the single data source
- **Blog pages** — sitemap, RSS, and Open Graph built in
- **Admin CMS** — write, edit, publish, and delete posts from `/admin` (Vercel / local `pnpm dev`)
- **Hardened auth** — bcrypt (cost 12) + JWT, login-failure lockout, recovery key
- **Media library** — auto WebP compression, Turso storage + GitHub/jsdelivr CDN dual-write
- **Custom logo & favicon** — upload your own logo in Site Settings; the favicon follows it automatically
- **Bilingual & themable** — zh/en switching, light/dark/system themes
- **Self-hosted comments** — guest comments with no login required; Cloudflare Turnstile + rate limits + content filters against spam; unread-badge inbox in the admin panel

## Architecture

pnpm workspace monorepo:

| Package | Role |
|---------|------|
| `apps/web` | Next.js app — blog pages + admin panel |
| `packages/database` | Turso (libSQL) access — posts, media, settings, users, auth lockout |
| `packages/auth` | Credential verification, JWT sessions, login lockout |
| `packages/core` | Shared domain logic — MDX utilities, types |

## Deployment

Both targets share one Turso database. They differ in **when** posts are read and whether the admin API is available.

### 1. Vercel (SSR + admin)

Full Next.js server deployment. Blog pages and `/api/*` run as Server Components / Route Handlers and query Turso **on each request** (CDN `s-maxage=60`). `/admin` works in production.

| | |
|---|---|
| Build | `pnpm build` |
| Data | Request-time from Turso |
| Content updates | Publish in `/admin` → live within ~60s; **no redeploy** for posts |
| Code updates | Push `main` → Vercel rebuilds the app |
| Secrets | Vercel Environment Variables (`TURSO_*`, `SESSION_SECRET`, …) |

Setup: import the repo → Root Directory `apps/web` → Build Command `pnpm build` → set env vars. Do **not** use `pnpm export` on Vercel (that drops SSR and admin).

### 2. GitHub Pages (static export)

CI runs `pnpm export` (`NEXT_EXPORT=true`), queries Turso **at build time**, and publishes pure HTML/CSS/JS from `apps/web/out`. No `/api` or `/admin` on the static host.

| | |
|---|---|
| Build | `pnpm export` via `.github/workflows/deploy.yml` |
| Data | Build-time snapshot from Turso |
| Content updates | Only after the next Actions run |
| Code / content refresh | Push `main` (or `workflow_dispatch`) → Actions rebuilds |
| Secrets | GitHub Actions Secrets (`TURSO_*`, `GH_PAT`) |

Writing happens on local `pnpm dev` or on the Vercel `/admin`; the Pages site is a static mirror refreshed by CI.

See the [deployment guide](https://zephyr110.vercel.app/posts/zlog-deployment-guide) for diagrams and checklists.

## Getting Started

### Prerequisites

Node.js 20+ · pnpm 9+

### Install & run

```bash
pnpm install
cd apps/web && cp .env.local.example .env.local   # fill in the values
pnpm dev          # blog at :3000, admin at /admin/login
```

Key env vars: `TURSO_DATABASE_URL` (use `file:./zlog.db` for local dev), `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (seed the admin user on first login), `NEXT_PUBLIC_SITE_URL`, and for guest comments `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (free Cloudflare Turnstile widget — see `apps/web/.env.local.example` for the local-dev test keys).

Create or reset the admin user without env vars:

```bash
pnpm create-admin --username admin --password "your-password"
```

### Build commands

```bash
pnpm build       # Vercel / Node — SSR + admin
pnpm export      # static export to apps/web/out (GitHub Pages)
```

## License

MIT

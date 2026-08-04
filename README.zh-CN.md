# Zlog

一个简约、快速、双语的个人博客，带本地后台管理系统。基于 [Next.js](https://nextjs.org) 16 (App Router)、[Tailwind CSS](https://tailwindcss.com) 4、[shadcn/ui](https://ui.shadcn.com)、[MDX](https://mdxjs.com) 和 [Turso](https://turso.tech) (libSQL) 构建，部署为纯静态站点。

线上体验：[zephyr110.vercel.app](https://zephyr110.vercel.app)

静态镜像：[zephyr110.github.io](https://zephyr110.github.io)

<img width="1440" height="2064" alt="zephyr110 vercel app_about (2)" src="https://github.com/user-attachments/assets/00d57a80-7806-4532-92ac-e12751966dd8" />
<img width="1440" height="2064" alt="zephyr110 vercel app_about (1) (1)" src="https://github.com/user-attachments/assets/954808c2-c12e-47eb-85b5-8023a65791fc" />

## 功能模块

- **静态博客** — 预渲染页面，性能与 SEO 兼顾；内置 sitemap、RSS、Open Graph
- **本地后台** — 在 `/admin` 撰写、编辑、发布、删除文章
- **认证安全** — bcrypt (cost 12) + JWT，登录失败锁定、恢复密钥
- **媒体库** — 自动 WebP 压缩，Turso 存储 + GitHub/jsdelivr CDN 双写
- **自定义 Logo 与 Favicon** — 在站点设置中上传自己的 Logo，Favicon 自动跟随
- **双语与主题** — 中/英切换，浅色/深色/跟随系统
- **Giscus 评论** — 基于 GitHub Discussions（可选）

## 核心架构

pnpm monorepo：

| 包 | 职责 |
|----|------|
| `apps/web` | Next.js 应用 — 静态博客页面 + 客户端后台面板 |
| `packages/database` | Turso (libSQL) 数据访问 — 文章、媒体、设置、用户、认证锁定 |
| `packages/auth` | 凭据校验、JWT 会话、登录锁定 |
| `packages/core` | 共享领域逻辑 — MDX 工具、类型 |

博客页面完全静态生成（`output: export`），每次推送到 `main` 由 CI 自动部署到 GitHub Pages。后台 CMS 通过 `pnpm dev` 在本地运行（静态导出不包含 API 路由）。在 Vercel 上，同一份代码以服务端方式运行后台 CMS。

## Getting Started

### 环境要求

Node.js 20+ · pnpm 9+

### 安装与运行

```bash
pnpm install
cd apps/web && cp .env.local.example .env.local   # 填写配置
pnpm dev          # 博客 :3000，后台 /admin/login
```

关键环境变量：`TURSO_DATABASE_URL`（本地开发用 `file:./zlog.db`）、`TURSO_AUTH_TOKEN`、`SESSION_SECRET`、`ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`（首次登录时播种管理员账号）、`NEXT_PUBLIC_SITE_URL`，以及可选的 `NEXT_PUBLIC_GISCUS_*` 评论配置。

不依赖环境变量创建/重置管理员：

```bash
pnpm create-admin --username admin --password "your-password"
```

### 构建与部署

```bash
pnpm export      # 静态导出到 apps/web/out
```

推送 `main` 分支 → GitHub Actions 自动构建并部署到 GitHub Pages。Vercel/Node 托管改用 `pnpm build` —— 后台 CMS 可在服务端运行。详细步骤请参考[部署指南](https://zephyr110.vercel.app/posts/zlog-deployment-guide)。

## License

MIT

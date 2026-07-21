# BitLog

一个简约、快速、双语的个人博客，基于 [Next.js](https://nextjs.org) App Router、[Tailwind CSS](https://tailwindcss.com)、[shadcn/ui](https://ui.shadcn.com) 和 [MDX](https://mdxjs.com) 构建。

BitLog 为追求简洁写作体验的开发者设计，提供本地运行的轻量级 CMS。使用 Markdown/MDX 编写文章，通过后台管理面板进行管理，最终部署为纯静态站点。

## 功能特性

- **静态站点生成** — 预渲染页面，兼顾性能与 SEO。
- **本地后台管理** — 在 `/admin` 中撰写、编辑、发布和删除文章。
- **MDX 内容** — 丰富的 Markdown 支持，包括语法高亮代码块、表格和 frontmatter。
- **双语支持** — 内置中文 / English 切换。
- **暗色模式** — 跟随系统的浅色/暗色主题切换。
- **Giscus 评论** — 基于 GitHub Discussions 的评论系统（可选）。
- **自动 SEO** — 站点地图、RSS 订阅、Open Graph 和 Twitter 卡片。
- **标签导航** — 按标签浏览文章。
- **阅读统计** — 每篇文章的字数统计和预估阅读时间。

## 技术栈

- **框架:** Next.js 16 (App Router)
- **样式:** Tailwind CSS 4 + shadcn/ui 组件
- **UI 基础:** @base-ui/react
- **内容:** MDX，基于 `next-mdx-remote`、`gray-matter`、`rehype-pretty-code`
- **认证:** JWT (`jose`) + bcryptjs
- **图表:** Recharts
- **图标:** Lucide React
- **包管理器:** pnpm

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装

```bash
pnpm install
```

### 环境变量

复制示例文件并更新配置：

```bash
cp .env.local.example .env.local
```

必需变量：

| 变量 | 说明 |
|------|------|
| `ADMIN_USERNAME` | 后台管理面板的用户名 |
| `ADMIN_PASSWORD_HASH` | Base64 编码的 bcrypt 密码哈希 |
| `SESSION_SECRET` | 用于签发 JWT 令牌的随机密钥 |
| `NEXT_PUBLIC_SITE_URL` | 站点的公开访问 URL |

生成密码哈希：

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('你的密码', 10).then(h => console.log(Buffer.from(h).toString('base64')))"
```

Giscus 评论（可选）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_GISCUS_REPO` | `用户名/仓库名` |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | 从 giscus.app 获取 |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | 讨论分类名称 |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | 从 giscus.app 获取 |

### 启动开发服务器

```bash
pnpm dev
```

博客页面访问 [http://localhost:3000](http://localhost:3000)，后台管理访问 [http://localhost:3000/admin/login](http://localhost:3000/admin/login)。

## 后台管理

- 使用 `.env.local` 中配置的凭据登录。
- 以 Markdown/MDX 格式创建和编辑文章。
- 使用 `Ctrl/Cmd + S` 保存草稿。
- 从文章列表中发布/撤回或删除文章。
- 通过媒体库上传图片（`/admin/media`）。

## 内容管理

文章以 `.mdx` 文件形式存放在 `content/posts/` 目录中。草稿存放在 `content/drafts/` 目录中。

Frontmatter 示例：

```yaml
---
title: "我的第一篇文章"
slug: "my-first-post"
date: "2026-07-19"
tags: ["nextjs", "blog"]
description: "用于 SEO 和预览的简短描述。"
draft: false
---
```

代码块支持语法高亮和一键复制：

````markdown
```typescript
const greeting = "Hello, BitLog!"
```
````

## 部署

### GitHub Pages

项目包含 GitHub Actions 工作流（`.github/workflows/deploy.yml`），每次推送到 `main` 分支时自动构建并部署到 GitHub Pages。

**配置步骤：**

1. Fork 或推送此仓库到你的 GitHub 账号。
2. 在目标 GitHub Pages 仓库中，进入 **Settings → Secrets and variables → Actions**，添加：
   - `GH_PAT`：具有 `repo` 权限的[个人访问令牌](https://github.com/settings/tokens)。
3. 修改 `.github/workflows/deploy.yml`：
   - 将 `external_repository` 改为 `你的用户名/你的用户名.github.io`。
4. 在工作流中设置 `NEXT_PUBLIC_SITE_URL` 环境变量为你的 Pages URL。
5. 如需评论功能，在工作流中配置 `NEXT_PUBLIC_GISCUS_*` 变量。
6. 推送到 `main` — 工作流将自动构建并部署。

**手动静态导出：**

```bash
pnpm export
```

此命令会在 `out/` 目录中生成静态站点，可部署到任何静态托管服务。

### Vercel

1. 将仓库导入 [Vercel](https://vercel.com)。
2. **Build Command** 设置为 `pnpm build`（**不要**用 `pnpm export`）。
3. **Output Directory** 使用默认的 `.next`。
4. 在 Vercel 项目设置中添加环境变量：
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` — 后台认证。
   - `NEXT_PUBLIC_SITE_URL` — 你的 Vercel 域名。
   - `NEXT_PUBLIC_GISCUS_*` — 如果使用 Giscus 评论。
5. 部署。Vercel 上 `/admin/login` 后台管理面板可正常使用，因为 Vercel 运行 Node 服务器。

> **注意：** 静态导出（`pnpm export`）会移除后台 API — 仅用于 GitHub Pages。Vercel/Node 托管保留完整的后台 CMS 功能。

## 项目结构

```
bitlog/
├── content/              # MDX 文章和草稿
├── public/               # 静态资源
├── scripts/              # 构建辅助脚本
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件
│   │   ├── admin/        # 后台 UI 组件
│   │   ├── blog/         # 博客渲染组件
│   │   ├── layout/       # 页头、主题、国际化
│   │   └── ui/           # shadcn/ui 组件
│   ├── lib/              # 工具函数、认证、内容 API
│   └── types/            # TypeScript 类型定义
├── .env.local.example    # 环境变量模板
├── next.config.ts
├── package.json
└── README.md
```

## 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm export` | 静态导出构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |

## 自定义

- 编辑 `src/lib/site-config.ts` 修改站点名称、作者和社交链接。
- 更新 `src/lib/i18n.ts` 添加或修改翻译文本。
- 调整 `src/app/globals.css` 自定义主题颜色和滚动条样式。

## 许可证

MIT

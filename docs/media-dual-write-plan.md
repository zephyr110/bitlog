# 图片存储双写架构（Turso 权威存储 + GitHub/jsdelivr 分发层）实现方案

> 方案状态：**已确认，待实施**
> 适用项目：`zephyr110/bitlog`
> 日期：2026-08-01

## 1. 背景与动机

bitlog 后台媒体页面上传的图片当前写入本地磁盘 `public/images`（`apps/web/src/app/api/upload/route.ts`），存在两个问题：

1. **Vercel/Serverless 下 `public/` 写入是临时性的**（构建时重置），图片无法持久化
2. 图片走站点自身域名，无 CDN 加速，国内访问跨洋加载慢

目标架构（方案 1，双写）：

- **Turso (libSQL) 做权威存储**：图片二进制（BLOB）入库，无容量焦虑（GitHub 仓库 1GB 审核线不再是硬约束），可随时重建分发层
- **GitHub `zephyr110/blog-img` 仓库 + jsdelivr CDN 做分发层**：文章图片链接用 jsdelivr 国内 CDN 节点，加载快

> 已确认：jsdelivr **只能服务 GitHub 仓库 / npm 包**，不能缓存任意后端 API，所以"图片存 Turso + jsdelivr 直接加速"不成立；双写架构是正确形态。
>
> 已确认：图片以 **BLOB（二进制原样）** 存入 Turso，**不转 base64**（base64 膨胀 33%，浪费存储与流量）。GitHub Contents API 传输层需要 base64 编码，与 Turso 的 BLOB 存储是两条独立通道，互不冲突。

## 2. 架构总览

```
POST /api/upload
  multipart → 校验（MIME/5MB/magic bytes，已有）
    → sharp 压缩（新增）
    → ① Turso media 表写 BLOB（权威存储）
    → ② GitHub Contents API 推 blog-img@main（分发层）
    → ③ 预热 jsdelivr（触发缓存同步）
    → 返回 { url: "https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>", filename }

文章引用:  ![alt](https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>)
Media 页复制: 同上 jsdelivr 完整链接（markdown 图片格式）
```

## 3. 改动清单

| 类型 | 文件 | 说明 |
|------|------|------|
| 新增 | `packages/database/src/media.ts` | media 表 + CRUD（BLOB 存储） |
| 修改 | `packages/database/src/index.ts` | 导出 media 函数 |
| 新增 | `apps/web/src/lib/image-compress.ts` | sharp 压缩 |
| 新增 | `apps/web/src/lib/github-image.ts` | GitHub Contents API 封装 |
| 新增 | `apps/web/src/app/api/media/[name]/route.ts` | 图片直读 API（容灾/导出） |
| 修改 | `apps/web/src/app/api/upload/route.ts` | POST 压缩+双写；GET 查表；DELETE 双删 |
| 修改 | `apps/web/src/app/admin/media/page.tsx` | 复制 URL/MD 跳过 origin 拼接（2 行） |
| 修改 | `apps/web/.env.local.example` | 新增 4 个环境变量 |
| 修改 | README | 上传架构说明 |

无新增 npm 依赖（`sharp@0.35.3`、`@libsql/client` 均在依赖中）。

## 4. 数据库层 — `packages/database/src/media.ts`

沿用 `content.ts` 的既有模式（`SCHEMA` 常量 + `ensureTable` 惰性建表 + `requireDb`）：

```sql
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT UNIQUE NOT NULL,      -- 与 GitHub 侧同名 <timestamp>-<name>
  content_type TEXT NOT NULL,         -- image/webp 等
  size INTEGER NOT NULL,
  data BLOB NOT NULL,                 -- sharp 压缩后的二进制，字节与 GitHub 侧一致
  github_sha TEXT,                    -- GitHub 最新 commit sha（删除时免查询）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
```

导出函数（`index.ts` 补导出）：

| 函数 | 说明 |
|------|------|
| `insertMedia({ filename, contentType, size, data, githubSha })` | 写入一行 |
| `listMedia()` | **显式列名查询**（`SELECT filename, content_type, size, created_at`），绝不 `SELECT *`——避免列表请求把全部 BLOB 拉进内存 |
| `getMediaData(filename)` | 含 BLOB 的单行（直读 API / 导出用） |
| `deleteMedia(filename)` | 删除并返回被删行（拿到 `github_sha` 供 GitHub 侧删除） |

## 5. 图片压缩 — `apps/web/src/lib/image-compress.ts`

```ts
compressImage(buffer: Buffer, mime: string) → { buffer, mime, ext }
```

按格式分流：

| 输入 | 处理 | 输出 ext |
|------|------|---------|
| jpeg | `sharp(b).resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 })` | `.webp` |
| png | 同上但 `.webp({ lossless: true })`（截图/插画场景，无损保真） | `.webp` |
| gif | `metadata()` 检查 `pages > 1`（动图）→ 原样返回（sharp 读 GIF 只取第一帧，会丢动画）；单帧静态 gif 转 webp | 原样 / `.webp` |
| webp | 原样（二次压缩收益 <10%） | `.webp` |
| svg | 原样（矢量文本格式） | `.svg` |

细节：

- 压缩结果若比原图大（极少见），用原图
- `quality` 走环境变量 `BLOG_IMG_QUALITY`（默认 80）
- 尺寸保险：最长边限制 4096，防止超大原图撑爆 serverless 内存与仓库体积
- 文件名后缀必须随格式变化（`.png` → `.webp`），否则 jsdelivr 按后缀返回错误 Content-Type

## 6. GitHub 分发层 — `apps/web/src/lib/github-image.ts`

封装 GitHub Contents API：

```ts
uploadToGithub(filename, buffer) → { sha }
  PUT /repos/zephyr110/blog-img/contents/<filename>
  body: {
    message: `upload ${filename}`,
    content: buffer.toString("base64"),   // GitHub API 传输层要求 base64
    branch: "main"
  }
  headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
  30s AbortController 超时

deleteFromGithub(filename, sha?)
  优先用 Turso 存的 sha；无则 GET /contents/<file> 取最新 sha
  DELETE /repos/.../contents/<file>?branch=main + body { message, sha }
  404 → 视为已删除（幂等）
```

配置全部走环境变量，不硬编码：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BLOG_IMG_GITHUB_TOKEN` | —（必需） | fine-grained token，只授权 `zephyr110/blog-img` 仓库 Contents: Read/Write |
| `BLOG_IMG_REPO` | `zephyr110/blog-img` | 目标仓库 |
| `BLOG_IMG_CDN_BASE` | `https://cdn.jsdelivr.net/gh/zephyr110/blog-img` | jsdelivr 备用域名（fastly/gcore）可随时切换，不改代码 |
| `BLOG_IMG_QUALITY` | `80` | webp 压缩质量 |

> 注意：Contents API 走正常 commit（非 force push），不受 blog-img `main` 分支保护影响。

## 7. 上传 API 改造 — `apps/web/src/app/api/upload/route.ts`

### POST（核心改造）

1. **现有校验全部保留**：MIME 白名单 / 5MB 上限 / magic bytes / SVG 内容检查——通过后才压缩（防解压炸弹）
2. `compressImage` → 得最终 buffer + ext
3. 文件名：沿用 `sanitizeFilename` + `timestamp-` 前缀，**后缀用压缩后的 ext**
4. **先写 Turso（权威）**：`insertMedia`
5. **再推 GitHub（分发）**：`uploadToGithub`，成功拿 sha 回填 `github_sha`
6. **一致性**：
   - GitHub 失败 → `deleteMedia` 回滚 Turso → 返回 500（错误信息区分"GitHub 上传失败"）
   - Turso 失败 → 不碰 GitHub，直接 500
7. 成功后 **fire-and-forget 预热**：`fetch(cdnBase/filename)` 触发 jsdelivr 同步（不阻塞响应；jsdelivr 对 `@main` 分支按需同步，分钟级可见）
8. 返回 `201 { url: "https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>", filename }` —— **绝对 URL**

### GET

`listMedia()` → `{ images: [{ name, url: cdnBase/filename }] }`，按 `created_at` 倒序。删除本地 `readdir` 逻辑。

### DELETE

双删流程：

```
getMediaData(filename) → 拿 github_sha
→ deleteFromGithub(filename, sha)   // 404 视为已删除（幂等）
→ deleteMedia(filename)
→ 返回 { success: true }
```

保留 filename 格式校验（白名单 ext + 无路径分隔符，防止构造 GitHub API 路径）。

## 8. 前端微调 — `apps/web/src/app/admin/media/page.tsx`

只改 2 个复制函数（`copyToClipboard` / `copyMarkdown`，约 L127-141），其余零改动：

```ts
// 后端返回已是完整 jsdelivr 绝对 URL，跳过 origin 拼接
const full = url.startsWith("http") ? url : `${window.location.origin}${url}`
```

- 复制 URL → `https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>`
- 复制 Markdown → `![alt text](https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>)`
- `media-picker-dialog.tsx`、`post-editor.tsx` 零改动——它们只是把 `data.url` 字符串插入 markdown

## 9. 图片直读 API — `apps/web/src/app/api/media/[name]/route.ts`

Turso BLOB 的可读出口，两个用途：

1. **容灾兜底**：jsdelivr 失效时文章图片可临时切换直链
2. **数据导出**：重建 GitHub 仓库时从 Turso 拉回字节

```ts
GET /api/media/<filename>
  → getMediaData(filename)
  → new Response(data, {
      headers: { "Content-Type": content_type, "Cache-Control": "public, max-age=86400" }
    })
```

无需鉴权（图片是公开内容，与 jsdelivr 的角色一致）。

## 10. 环境变量

`.env.local.example` 追加（本地 `.env.local` 与 Vercel 项目环境变量各配一份）：

```bash
# ── 图片双写（Turso 权威存储 + GitHub/jsdelivr 分发）──
# fine-grained token 生成：GitHub → Settings → Developer settings →
#   Fine-grained personal access tokens → Generate new token →
#   仅授权 zephyr110/blog-img 仓库，Permissions → Contents: Read and write
BLOG_IMG_GITHUB_TOKEN=github_pat_xxx
BLOG_IMG_REPO=zephyr110/blog-img
BLOG_IMG_CDN_BASE=https://cdn.jsdelivr.net/gh/zephyr110/blog-img
BLOG_IMG_QUALITY=80
```

## 11. 实施后验证清单

| 验证项 | 方法 |
|--------|------|
| 压缩生效 | 上传 jpeg → 返回 `.webp`，体积较原图明显减小 |
| 双写一致 | 本地 `bitlog.db` media 表有行 & github.com/zephyr110/blog-img 有新 commit |
| jsdelivr 链接 | 返回 URL 访问：预热后 HTTP 200，Content-Type `image/webp` |
| GIF 动图 | 上传动图 → 动画保留，链接可用 |
| 列表 / 删除 | media 页刷新可见新图；删除后 Turso 行 + GitHub 文件都消失 |
| 前端格式 | 复制 MD = `![alt text](https://cdn.jsdelivr.net/gh/zephyr110/blog-img/<file>)` |

## 12. 风险与缓解

| 风险 | 缓解 |
|------|------|
| jsdelivr 同步延迟（新图分钟级 404） | 上传后预热触发首次抓取；README 注明 |
| GitHub API 限流（匿名 token 60 req/h） | 上传/删除是低频操作，足够；列表走 Turso 不耗配额 |
| GH_TOKEN 泄露 | fine-grained 单仓库授权 + Contents 最小权限；仅存服务端环境变量 |
| Turso 免费额度（存储/流量 GB 级） | sharp 压缩后单图 ~500KB，数年用量；列表查询不含 BLOB |
| GitHub 删除不可恢复 | media 页删除即永久，前端已有确认弹窗 |

## 13. 上线步骤

1. 实施第 3 节改动清单全部文件
2. 本地 `.env.local` 配置 4 个新变量
3. 本地启动验证（第 11 节清单）
4. Vercel 项目环境变量配置（第 10 节）
5. 推送部署，线上回归验证

# 自建评论系统设计（替代 giscus）

日期：2026-08-05 · 状态：已确认（待实施）

## 背景与目标

giscus 的两个缺陷：游客需登录 GitHub 才能评论；评论通知只能在 GitHub 仓库查看。目标：

1. 游客免登录即可评论（填写昵称 + 可选邮箱 + 内容）
2. 评论后 admin 在站内消息中心及时收到通知
3. 防脚本/恶意灌水（多层防御）

已确认决策：**即时显示 + Turnstile 验证码**；**独立消息中心页面 + 侧边栏徽标**；**不迁移 giscus 历史评论**。

## 架构

### 数据层（packages/database/src/comments.ts）

```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_comments_post ON comments(post_slug);
CREATE INDEX idx_comments_unread ON comments(is_read);
```

- `comment_rate_limit` 表：限流窗口计数（ip_hash + post_slug + 窗口开始时间 + 计数）。复用 db.ts 的 createTableGuard 模式。
- `site_settings` 表加 `comment_enabled` 字段（ALTER TABLE migration，照抄 logo_invert_dark 模式）。默认 1。
- 会话凭证：**无状态 HMAC 签名 token**（服务端 secret，不落库）。负载：post_slug、ip_hash、issuedAt（epoch ms）。TTL 5 分钟。

### API 路由

| 路由 | 认证 | 说明 |
|---|---|---|
| `GET /api/comments/session` | 无 | 签发签名 token（绑定 post_slug query + IP 哈希 + 时间戳） |
| `POST /api/comments` | 无（token） | 防垃圾管线后入库；未配置 Turnstile 时验证环节跳过（仍走其余管线） |
| `GET /api/comments?post=<slug>` | 无 | 公开评论列表（按时间正序） |
| `GET /api/admin/comments?page=&status=` | requireAuth | 列表 + 未读数；`?unread=1` 时只回未读数 |
| `POST /api/admin/comments/[id]/read` | requireAuth | 标记已读 |
| `DELETE /api/admin/comments/[id]` | requireAuth | 物理删除 |

### 防垃圾管线（POST /api/comments 顺序执行）

1. **评论开关**：site_settings.comment_enabled = 0 → 503
2. **会话凭证**：校验 HMAC 签名、TTL ≤5min、post_slug 匹配、ip_hash 匹配 → 失败 401
3. **时间陷阱**：issuedAt 距今 ≥2 秒，否则 400（脚本秒提交拦截）
4. **honeypot**：表单隐藏字段非空 → 静默丢弃（200 但不入库）
5. **Turnstile**：`siteverify`（Cloudflare API，2s 超时）；失败 400。env 未配置时跳过本步（降级模式）
6. **限流**（全部 DB 落盘，serverless 安全）：
   - IP：15 分钟 ≤5 条 → 429
   - Per-post：1 小时 ≤20 条 → 429
   - 全局：1 小时 ≤200 条 → 429
7. **内容过滤**：长度 2–1000；URL 数 ≤2；纯重复字符（≥80% 相同字符）→ 400
8. **入库**：201 + 返回评论对象

### 前端

**文章页（重写 comment-section.tsx）**
- 挂载时并行 `GET /api/comments?post=` + `GET /api/comments/session`
- 表单：昵称（必填 ≤30）、邮箱（可选，不公开）、内容 textarea（2–1000）、Turnstile widget（@marsidev/react-turnstile）
- 提交成功 → 清空 + 重新 fetch 列表；429/400 → 表单内错误提示
- 未配置 Turnstile → 表单降级为禁用提示（列表照常显示）
- 评论列表：昵称、UTC 日期、内容；邮箱不渲染；空状态文案
- 关闭评论 → 显示"评论已关闭"提示

**admin 消息中心**
- `/admin/comments` 页面：列表（未读优先）、标为已读、删除（确认）、分页（复用 pagination-bar）
- 侧边栏"评论"入口 + 未读徽标（60s 轮询 + visibilitychange 刷新）
- dashboard 统计加"未读评论"卡片（点击跳转）
- admin/settings 加"允许游客评论"开关

### 依赖与配置

- 新依赖：`@marsidev/react-turnstile`（MIT 开源）
- 新 env：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`（Vercel；CF 免费账号）
- 移除：giscus 相关代码与 env 使用（comment-section.tsx 重写；GISCUS env 保留无害可后续清理）

### i18n

- post.ts（zh/en）：评论标题计数、表单占位、提交/发送中、限流提示、内容被拒提示、验证失败、评论关闭、空状态、邮箱不公开说明
- admin.ts（zh/en）：评论管理页（未读、标为已读、删除确认、空状态）、侧边栏入口

### 验证

- lint + typecheck（项目规则）
- node 逻辑单测：HMAC token 签发/校验/过期/绑定、内容过滤、限流窗口
- Turnstile 联调需真实 sitekey（本地可 mock siteverify）

### 范围外（YAGNI）

- 评论回复/嵌套、点赞、邮箱订阅通知、自动熔断（先手动开关）、IP 封禁名单

# PCL.N Plugin Center Web

生产站点：

- 主站：`https://pcln.top`（市场、下载、工作台）
- 认证：`https://auth.pcln.top`（登录 / 协议 / OAuth）

部署：`Cloudflare Pages`（项目名 `pcl-n-web`）  
生产写入 API：`https://vtvhtscdvfnuttwapzxu.supabase.co/functions/v1/plugin-center-api`

PCL.N 插件中心的公开管理端，包含发布者工作台与平台管理工作区。

本仓库基于 [KOI-UI](https://github.com/KoiKite/koi-ui) 开发并保留原 MIT 许可证与提交历史。平台业务代码继续使用同一 MIT 许可证。

## 当前范围

- GitHub / Microsoft OAuth 登录（Supabase Auth，认证域 `auth.pcln.top`）
- 发布者插件、版本、审核记录、组织成员的 RLS 只读视图
- 管理员审核、插件目录、发布者和用户视图
- 响应式布局、暗色主题和中英文基础设施

写操作不会从浏览器直写数据库。创建组织、上传 `.pnp`、审核决定和封禁等操作将通过私有 API 执行并写入审计日志。

## 本地运行

要求 Node.js 24+ 与 pnpm 11+：

```console
pnpm install
pnpm dev --host 127.0.0.1
```

默认地址为 `http://127.0.0.1:5730/login`。

生产域名分工：

- `https://pcln.top` — 市场、下载、工作台等主站
- `https://auth.pcln.top` — 登录 / 协议确认 / OAuth 回跳（PKCE 在此完成）
- 登录成功后通过 `/auth/callback` 把会话移交回主站（URL fragment，不经服务器）

复制 `.env.example` 后可覆盖以下公开配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SERVER`

Publishable Key 本来就用于浏览器；绝不能把 Secret Key、数据库密码或 Service Role Key 放入 `VITE_*`。

## Cloudflare Pages 部署

域名已迁至 Cloudflare。同一 Pages 项目挂两个自定义域：

| 域名 | 用途 |
|------|------|
| `pcln.top` / `www.pcln.top` | 主站 |
| `auth.pcln.top` | 登录 / OAuth |

### 产物结构

```console
pnpm build:prod
```

- 输出目录：`dist/`
- SPA 回退：`dist/_redirects`（`/* → /index.html 200`）
- 关键深链壳：`dist/login/index.html`、`dist/auth/callback/index.html` 等

### GitHub Actions 自动部署

推送 `master` 触发 `.github/workflows/cloudflare-pages.yml`。

仓库 **Actions secrets**（Settings → Secrets and variables → Actions → Repository secrets）：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | 见下方「API Token 权限」 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 右侧栏 Account ID（Workers & Pages 页） |

#### API Token 权限（必读）

失败日志若出现 `Authentication error [code: 10000]`，说明 Token **能登录但无权操作 Pages**。

在 https://dash.cloudflare.com/profile/api-tokens 用 **Create Custom Token**：

| 类型 | 权限 |
|------|------|
| Account | **Cloudflare Pages — Edit** |
| Account | **Account Settings — Read** |
| User | **User Details — Read** |
| User | **Memberships — Read** |

- **Account Resources**：Include → 选中你的账号（不要用 Zone 级 token）
- 创建后整段粘贴为 `CLOUDFLARE_API_TOKEN`（只显示一次）
- Account ID 在 Workers & Pages 概览右侧，32 位十六进制

可选 Variables（覆盖 `.env.production` 内嵌值）：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_WEB_BASE_API`

### 本地手动发布

```console
# 需已登录 wrangler（npx wrangler login）或配置 CLOUDFLARE_API_TOKEN
pnpm deploy:cf
```

### Cloudflare 控制台（一次性）

1. Workers & Pages → 创建 / 绑定项目 `pcl-n-web`（或接受 Actions 首次 `pages deploy` 自动创建）
2. Custom domains：添加 `pcln.top`、`www.pcln.top`、`auth.pcln.top`
3. 构建配置若改用 CF 直连 Git：Build command `pnpm build:prod`，Output `dist`，Node 24，pnpm 11

旧 **GitHub Pages** 工作流已退役（`pages.yml` 仅提示）。

## GitHub OAuth 配置

1. 在 GitHub 创建 OAuth App。
2. Authorization callback URL 设置为 `https://vtvhtscdvfnuttwapzxu.supabase.co/auth/v1/callback`。
3. 在 Supabase Authentication / Providers 中启用 GitHub 并填写 Client ID 与 Client Secret。
4. 在 Supabase Redirect URLs 中加入：
   - 本地：`http://127.0.0.1:5730/login`、`http://127.0.0.1:5730/login/`
   - 生产认证站：`https://auth.pcln.top/login`、`https://auth.pcln.top/login/`
5. 首次登录后，从 `auth.users` 获取自己的 UUID，再由数据库管理员执行：

```sql
insert into public.plugin_center_admin_members (user_id, role)
values ('your-user-uuid', 'admin');
```

管理员授权只按不可变 UUID 判断，不按 GitHub 昵称或可修改的 `user_metadata` 自动提权。

## 校验

```console
pnpm type:check
pnpm build:prod
```

私有 API 与扫描 Worker 位于 `MuXue1230-owo/PCL-N-Plugin-Center-Server`。

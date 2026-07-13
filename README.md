# PCL.N Plugin Center Web

生产站点：`https://muxue1230-owo.github.io/PCL-N-Plugin-Center-Web/`

生产写入 API：`https://vtvhtscdvfnuttwapzxu.supabase.co/functions/v1/plugin-center-api`

PCL.N 插件中心的公开管理端，包含发布者工作台与平台管理工作区。

本仓库基于 [KOI-UI](https://github.com/KoiKite/koi-ui) 开发并保留原 MIT 许可证与提交历史。平台业务代码继续使用同一 MIT 许可证。

## 当前范围

- GitHub OAuth 登录入口（Supabase Auth）
- 发布者插件、版本、审核记录、组织成员的 RLS 只读视图
- 管理员审核、插件目录、发布者和用户视图
- ASP.NET Core API 的 Bearer Token 接入基础
- 响应式布局、暗色主题和中英文基础设施

写操作不会从浏览器直写数据库。创建组织、上传 `.pnp`、审核决定和封禁等操作将通过私有 API 执行并写入审计日志。

## 本地运行

要求 Node.js 24+ 与 pnpm 11+：

```console
pnpm install
pnpm dev --host 127.0.0.1
```

默认地址为 `http://127.0.0.1:5730/login`。

复制 `.env.example` 后可覆盖以下公开配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SERVER`

Publishable Key 本来就用于浏览器；绝不能把 Secret Key、数据库密码或 Service Role Key 放入 `VITE_*`。

## GitHub OAuth 配置

1. 在 GitHub 创建 OAuth App。
2. Authorization callback URL 设置为 `https://vtvhtscdvfnuttwapzxu.supabase.co/auth/v1/callback`。
3. 在 Supabase Authentication / Providers 中启用 GitHub 并填写 Client ID 与 Client Secret。
4. 在 Supabase Redirect URLs 中加入本地 `http://127.0.0.1:5730/login` 和生产站点登录地址。
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

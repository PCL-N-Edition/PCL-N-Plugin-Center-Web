# Nexa Cloud

自托管的 NexaStore、Console 与 Operations。旧 N Cloud 前端与托管身份依赖已移除，遥测页面及统计逻辑迁移保留。

需要 Node.js 24.14+ 与 pnpm。

```powershell
pnpm install --frozen-lockfile
pnpm dev:server
# 另一个终端
pnpm dev
```

访问 http://127.0.0.1:5730。验证：`pnpm check`。生产构建：`pnpm build`；启动服务：`pnpm start`。

[自托管、账户初始化、遥测迁移与已知边界](docs/self-hosting.md)。当前不是规划 P0/P1 全部完成，也没有执行生产数据迁移或上线。

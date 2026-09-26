# Nexa Cloud 自托管交付说明

## 本次边界

用户在 2026-09-26 明确选择“全部迁到自管服务器与数据库”。规划 v1.0 是参考材料，其中 Cloudflare、D1、R2 的建议不作为本次部署要求。

本仓库已移除旧 N Cloud 账户、桌面授权、后台模板、旧商店与开发者页面、Supabase 客户端、跨域 token 交接和本站 Cloudflare/Sites 发布入口。NexaStore、Console、Operations 使用同一套自有 Vue 页面和同源 API。启动器介绍、下载与更新日志仍保留在 `/launcher`、`/download`、`/changelog`，旧遥测链接重定向到 `/operations/telemetry`。

这是可运行的自托管基础版本，不是规划 P0/P1 全部验收完成：组织/成员/发布者后台、上传扫描审核流程、MFA、敏感操作重新验证、完整账户恢复策略、生产容量验证尚待实现。支付、结算、广告未开放。没有迁移生产账户、导出生产数据、修改 DNS 或关闭旧生产服务。相邻 Server/Auth 仓库保留为历史迁移来源，本次运行不加载它们。

## 运行与数据所有权

- Node.js 24.14+，Vue 3 / Vite；服务端只使用 Node 内置模块。
- SQLite 数据库（WAL、外键、事务）和制品目录在自有磁盘上。没有 Supabase、D1、R2 或外部身份服务运行依赖。
- 当前设计为单节点、单服务进程。不要把 SQLite 放到网络共享卷或启动多个实例。大规模写入、商业交易和高可用需求确定后，须重新验证数据库选型，不能把当前结果视为商业验收。
- GitHub 仅用于启动器公开下载目录、更新记录和手动诊断 issue 匹配，不保存平台账户或业务数据。下载目录有仓库中的本地快照回退。

本地开发（两个终端）：

```powershell
pnpm install --frozen-lockfile
pnpm dev:server
pnpm dev
```

打开 `http://127.0.0.1:5730`。API 默认监听 `127.0.0.1:5731`，数据默认写入 `data/nexa.sqlite`。目录已被 Git 忽略。空数据库不会生成虚构账户或资源。

生产先执行 `pnpm check`。通过 `.env.example` 所列的服务端环境变量配置进程；文件不会被 Node 自动加载，需要进程管理器注入或使用 `node --env-file=... server/index.mjs`。`NEXA_ORIGIN` 必须是准确的 HTTPS Origin，不含末尾斜线。反向代理保留浏览器 Origin，终止 HTTPS 后转发到服务端。不要将数据库或制品目录作为静态网站目录。

可选 Docker：在仓库根执行 `docker compose -f deploy/compose.yaml up --build -d`，提前设置 `NEXA_ORIGIN`。数据卷 `nexa-data` 必须独立备份。示例反向代理见 `deploy/Caddyfile.example`。Docker 配置已提供，本机尚未验证容器构建与生产 TLS。

## 受控账户与会话

首次账户通过本机管理员命令创建，无公开注册端点：

```powershell
# 将临时环境变量设置为你自己选择的强密码，不要把真实值提交或放到命令历史中。
node server/manage.mjs create-user owner staff
node server/manage.mjs create-user invited-user
```

密码从 `NEXA_INITIAL_PASSWORD` 环境变量读取，14–256 字符，完成后清除该环境变量。使用 Node scrypt 随机盐派生，数据库不保存明文密码。浏览器使用 HttpOnly / SameSite=Strict Cookie，生产加 Secure；数据库只存 session token 哈希。Console 和 Operations Cookie 与会话范围分开；普通用户和普通会话不能进入内部 API。管理会话 1 小时，普通会话 24 小时；每次请求重新查询当前账户资格。所有浏览器写操作要求精确 Origin 和请求标记，登录有账户/IP/全局限流。

本地恢复命令 `node server/manage.mjs reset-password NAME` 使用同一个临时环境变量，重置后立即撤销该用户所有会话并留下记录。此操作依赖服务器管理员身份，不等同于已完成 MFA 和离线恢复材料演练。反向代理环境中当前 IP 限流使用连接地址，未盲目信任外部 X-Forwarded-For；共享代理地址可能造成整体限流，应在受信任网关层配置额外限流。

## 当前真实业务闭环

普通用户在 Console 创建支持请求 → 仅能读取自己的请求 → 工作人员使用独立登录在 Operations 读取待办并标记解决 → 用户查看结果。状态更新以版本进行条件写入，变更与审计同事务提交。列表当前最多显示最近 200 项；不能将页面数量当成全库统计。

商店支持公开目录、分类、搜索、详情和免费获取。现阶段由本地负责人导入已检查的文件，**不是开放投稿审核系统**：

```json
{
  "id": "example-resource-v1", "name": "资源名称", "summary": "简短说明",
  "description": "详细说明", "publisher": "发布者", "category": "template",
  "version": "1.0.0", "sha256": "由负责人实际检查过的文件的 SHA-256"
}
```

设置 `NEXA_REVIEW_REASON` 为检查说明，再运行 `node server/manage.mjs publish-curated manifest.json artifact.zip`。本地命令只接收负责人控制的文件，最大 64 MiB；不运行投稿代码，不声称完成扫描或独立审核。文件哈希必须匹配清单；内容按哈希存储，重复资源 ID 被拒绝，不能原地覆盖已发布内容。获取前重新验证哈希。`node server/manage.mjs withdraw ID` 要求原因并立即停止新下载，保留制品及审计记录。已经完成或正在进行的下载无法收回。未引用的制品不会自动删除。

## 遥测迁移

四个原遥测页面保留：主面板、运行分析、灰度配置、预检模型。采集校验、聚合、诊断和运行查询逻辑由相邻 Server 仓库以下模块迁入 `server/telemetry`，TypeScript 去类型为 MJS：`launcher-telemetry`、`launcher-diagnostics`、`launcher-runs`、`launcher-rollouts`、`launcher-diagnostic-issues`。原 SQL 0017–0021 保留；自有 SQLite adapter 提供参数绑定与整批事务。没有重新定义原统计口径。预检模型保持原来的停用策略，返回无权重空模型；不会重新启用旧算法。

采集协议：`POST /v1/launcher/telemetry` 与 `/v2/launcher/telemetry`；管理读取在 `/api/v1/admin/launcher/{telemetry,diagnostics,runs,rollouts,resource-model}`。修改灰度要求管理会话并检查 revision、记录审计。页面灰度编辑已迁移，但原启动器更新分发服务及其灰度执行端尚未移入本进程，不能仅凭此页面宣称已改变线上推送。GitHub 同步为显式手动操作，未部署每小时任务。

新采集能立即写入新库，但已有启动器仍指向旧服务器：上线需要先完成服务器切换或明确的受控转发。没有自动更改客户端配置或 DNS。

历史数据在新服务接收流量前导入：

1. 保留旧系统一致性备份；在旧系统导出遥测 SQLite 数据（若拿到 SQL dump，先在隔离环境转为 SQLite 文件）。不要从网页上传生产数据库。
2. 停止写入并备份新库，执行 `node server/manage.mjs import-telemetry source.sqlite`。
3. 命令只读取固定的十张遥测表，使用参数化插入，并在一个事务内提交。新库已有采集数据、规则变更或曾导入时拒绝执行；源表缺失时整体回滚，不累加旧计数。
4. 对照命令输出的每表行数、按日期/版本的统计以及灰度 revision，核验后再切换采集入口。
5. 原账户不自动继承管理权限；邀请用户重新建立账户，另行设计稳定用户 ID 的映射和数据迁移。

`node server/manage.mjs prune-telemetry` 延续原诊断 90 天清理策略，应在备份和留存策略确定后由自己的任务调度执行；不自动运行。

## 备份与验证

`node server/manage.mjs backup /safe/location/nexa.sqlite` 使用 SQLite 在线备份 API，避免只复制 WAL 模式下的主文件而漏数据。制品目录单独备份到独立故障域。恢复时停止服务，恢复数据库与对应制品，再执行健康检查、账户权限检查和抽样下载哈希核对。不要提交真实数据库、导出文件或密码。

`pnpm check` 运行类型检查、测试和构建。测试覆盖普通/内部会话隔离、跨用户工单、CSRF、重复处理、审计事务、撤权、注销、遥测实际入库与筛选、无效遥测拒绝、灰度版本冲突、事务回滚、备份恢复、导入回滚/重复导入、制品哈希及撤回。它不能代替生产导入、负载测试、MFA 或完整 P1 业务验收。

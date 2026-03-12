# NodeSeek RSS Monitor

一个以 Cloudflare Pages Functions 为优先部署方式的 NodeSeek RSS 订阅与 Telegram 推送工具。

当前仓库公开地址：
[JackLuo1980/nodeseeker2](https://github.com/JackLuo1980/nodeseeker2)

## 当前部署模式

- Pages 优先：Web 界面、API、Telegram Webhook 运行在 Pages Functions
- D1 数据库存储配置、订阅和文章数据
- 轮询抓取通过内部接口 `/internal/poll` 触发，适合配合外部 cron 缩短推送时差
- Worker 兼容入口仍然保留，但不再是推荐部署路径

## Pages 部署

Cloudflare 官方文档说明：
- Pages Functions 支持通过 Wrangler 配置文件管理绑定与构建输出
- `wrangler pages deploy` 可以上传静态资源和 `functions` 目录
- 如果要部署 `functions` 目录，不能只用 Dashboard 的拖拽上传，必须用 Wrangler

参考：
- [Pages Functions configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Use Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)

### 推荐方式一：Pages Git 集成

1. 在 Cloudflare 创建一个 Pages 项目并连接这个仓库
2. 生产分支选择 `main`
3. 构建命令填写：

```bash
pnpm install && pnpm run build
```

4. 构建输出目录填写：

```bash
dist/client
```

5. 绑定 D1 数据库：

- Binding：`DB`
- Database：`nodeseeker`

6. 可选环境变量：

```bash
POLL_SECRET=替换成高强度随机字符串
```

### 推荐方式二：Wrangler 直传 Pages

本仓库已经提供 Pages 配置文件 [wrangler.pages.jsonc](./wrangler.pages.jsonc)。

常用命令：

```bash
pnpm install
pnpm run build
pnpm run deploy:pages
```

本地调试 Pages：

```bash
pnpm run dev:pages
```

## Telegram 和 RSS 轮询

### Telegram Webhook

Pages 部署后，Bot Webhook 仍然指向：

```text
https://你的-pages-域名/telegram/webhook
```

### 低时差轮询

Pages 没有与当前 Worker `scheduled` 完全等价的入口，所以本仓库提供：

```text
POST /internal/poll
```

调用方式：

```bash
curl -X POST "https://你的-pages-域名/internal/poll" \
  -H "Authorization: Bearer $POLL_SECRET"
```

建议：

- 15 到 30 秒触发一次
- 可用 GitHub Actions、cron-job.org、Uptime Kuma 或你自己的服务器定时任务

## 诊断接口

如果部署后需要快速确认 Pages Functions 是否已启动、D1 是否已绑定，可访问：

```text
/__diag
```

正常情况下会返回 JSON，例如：

```json
{
  "ok": true,
  "bindings": {
    "hasDB": true
  }
}
```

## 仓库状态

- 当前仓库已经是公开仓库
- Pages 入口文件位于 [functions/[[path]].ts](./functions/[[path]].ts)
- 应用主入口位于 [src/app.ts](./src/app.ts)
- 轮询服务位于 [src/services/poller.ts](./src/services/poller.ts)

## 仍保留的 Worker 兼容命令

如果你还想临时用 Worker 部署，也保留了：

```bash
pnpm run deploy:worker
```

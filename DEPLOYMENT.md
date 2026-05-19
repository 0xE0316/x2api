# Deployment

## 1. PostgreSQL

推荐 Neon Postgres。

执行初始化：

```bash
psql "$DATABASE_URL" -f shared/schema.sql
```

## 2. GitHub Actions

在仓库 `Settings -> Secrets and variables -> Actions` 配置：

- `DATABASE_URL`
- `IMGBB_API_KEY`

首次建议按顺序手动运行：

1. `Update Nitter Instances`
2. `Manage Subscriptions And Query`
   - `action`: `register_client`
3. `Manage Subscriptions And Query`
   - `action`: `subscribe_set`
   - `api_key`: 上一步产物中的 key
   - `targets`: `OpenAI,search:AI safety`
4. `Twitter Monitor`
   - 单节点保持默认
   - 如果要并行采集，可在手动触发时填写 `shard_count`，例如 `3`

## 3. Vercel

将仓库导入 Vercel 后：

1. 把项目 `Root Directory` 设为 `service`
2. 配置环境变量：

- `DATABASE_URL`

Vercel 的 monorepo / root directory 配置说明见：

- [Using Monorepos](https://vercel.com/docs/monorepos/)
- [General settings](https://vercel.com/docs/project-configuration/general-settings)

## 4. 验证

注册客户端后，验证这些地址：

- `POST /api/client/register`
- `GET /api/subscriptions`
- `GET /api/items`
- `GET /rss/:feedToken.xml`

## 5. 运营建议

- GitHub Actions 定时采集
- Vercel 专门服务客户端请求
- 定期轮换暴露过的 `feedToken`
- 给每个客户端限制订阅数量，尤其是关键词数

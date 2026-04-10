# News Hub

自托管 RSS 新闻聚合平台。从 130+ 信息源自动抓取文章，按分类展示，支持管理后台和每日报告生成。

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（http://localhost:3000）
npm run dev

# 生产构建 & 启动
npm run build
npm run start
```

首次启动自动初始化数据库、写入默认分类和 RSS 源，无需手动配置。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ADMIN_PASSWORD` | `admin` | 管理后台登录密码 |
| `PORT` | `3000` | 服务端口 |

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router（SSR + API Routes） |
| 数据库 | SQLite（better-sqlite3，WAL 模式） |
| RSS 解析 | rss-parser |
| 定时任务 | node-cron |
| 样式 | Tailwind CSS 3（暗色主题，class 模式） |
| 语言 | TypeScript（strict 模式） |

## 文档目录

- [架构设计](architecture.md) — 项目结构、数据模型、核心模块
- [API 参考](api.md) — 所有接口的路径、参数和响应格式
- [管理后台](admin-guide.md) — 后台功能说明和配置项

## 默认数据

系统预设 **10 个分类**、**130+ RSS 源**：

| 分类 | Slug | 源数量 |
|------|------|--------|
| 新闻热榜 | `news-hot` | 12 |
| 科技资讯 | `tech-cn` | 13 |
| AI 与大模型 | `ai-llm` | 14 |
| 开发者 | `dev-cn` | 9 |
| 生活 | `lifestyle` | 8 |
| 汽车 | `automobile` | 8 |
| 摩托车 | `motorcycle` | 6 |
| AI Research | `ai-research` | 4 |
| AI Products | `ai-products` | 5 |
| AI Ethics | `ai-ethics` | 4 |

> 数据通过 `src/lib/seed.ts` 写入，仅在数据库为空时执行，安全可重复运行。

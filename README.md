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

## 功能

- **RSS 聚合**：130+ 预置信息源，支持自定义添加，自动定时抓取
- **分类浏览**：10 个分类（新闻热榜、科技、AI、开发者、生活、汽车、摩托车等）
- **管理后台**：源管理（CRUD + 测试 + 批量导入）、分类管理（拖拽排序）、系统设置
- **每日报告**：自动生成 Markdown 格式日报，按分类和源分组
- **自动清理**：可选的过期文章自动删除
- **响应式设计**：移动端友好的暗色主题 UI

## 默认数据

| 分类 | 源数量 |
|------|--------|
| 新闻热榜 | 12 |
| 科技资讯 | 13 |
| AI 与大模型 | 14 |
| 开发者 | 9 |
| 生活 | 8 |
| 汽车 | 8 |
| 摩托车 | 6 |
| AI Research | 4 |
| AI Products | 5 |
| AI Ethics | 4 |

## 文档

- [架构设计](docs/architecture.md) — 项目结构、数据模型、核心模块
- [API 参考](docs/api.md) — 所有接口的路径、参数和响应格式
- [管理后台](docs/admin-guide.md) — 后台功能说明和配置项

## 命令

```bash
npm run dev     # 开发服务器
npm run build   # 生产构建
npm run start   # 启动生产服务器
```

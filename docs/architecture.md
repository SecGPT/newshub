# 架构设计

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 根布局（暗色主题、字体）
│   │   ├── globals.css                # 全局样式
│   │   ├── page.tsx                   # 首页 — 分类筛选 + 按源分组文章
│   │   ├── source/[id]/page.tsx       # 源详情页 — 分页文章列表
│   │   ├── admin/
│   │   │   ├── layout.tsx             # 管理布局（鉴权守卫 + 侧边栏）
│   │   │   ├── login/page.tsx         # 登录页
│   │   │   ├── page.tsx               # 仪表盘
│   │   │   ├── sources/page.tsx       # 源管理（CRUD + 测试 + 导入）
│   │   │   ├── categories/page.tsx    # 分类管理（CRUD + 拖拽排序）
│   │   │   └── settings/page.tsx      # 系统设置
│   │   └── api/
│   │       ├── news/route.ts          # GET 文章列表
│   │       ├── fetch/route.ts         # POST 触发抓取
│   │       ├── report/route.ts        # GET 生成报告
│   │       └── admin/
│   │           ├── login/route.ts     # POST 登录
│   │           ├── sources/           # 源 CRUD + 测试 + 导入
│   │           ├── categories/        # 分类 CRUD + 排序
│   │           └── settings/route.ts  # 设置读写
│   ├── lib/
│   │   ├── db.ts                      # SQLite 单例 + 全部数据操作
│   │   ├── fetcher.ts                 # RSS 抓取引擎（批量并发）
│   │   ├── scheduler.ts               # 定时任务管理（node-cron）
│   │   ├── reporter.ts                # Markdown 日报生成
│   │   ├── seed.ts                    # 默认数据初始化
│   │   ├── types.ts                   # TypeScript 接口 + 常量
│   │   └── utils.ts                   # 工具函数
│   ├── components/
│   │   ├── Header.tsx                 # 顶部导航栏
│   │   ├── CategoryTabs.tsx           # 分类标签切换
│   │   ├── SourceBlock.tsx            # 单源文章区块
│   │   ├── ArticleCard.tsx            # 文章卡片
│   │   ├── Pagination.tsx             # 分页组件
│   │   └── RelativeTime.tsx           # 相对时间显示
│   └── instrumentation.ts             # 服务器启动入口
├── data/
│   └── news.db                        # SQLite 数据库（自动创建）
├── output/                            # Markdown 日报输出目录
├── docs/                              # 项目文档
├── CLAUDE.md                          # Claude Code 指令
├── package.json
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 启动流程

```
服务器启动
  └─ instrumentation.ts
       ├─ initDb()          → 创建/连接 SQLite，建表
       ├─ seedDefaults()    → 空库时写入默认分类、源、设置
       └─ startScheduler()  → 启动定时任务（抓取/报告/清理）
```

## 数据模型

### 数据库 Schema（SQLite）

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  feed_url TEXT UNIQUE NOT NULL,
  site_url TEXT,
  category_id INTEGER REFERENCES categories(id),
  enabled INTEGER DEFAULT 1,
  refresh_interval INTEGER DEFAULT 0,   -- 分钟，0 = 使用全局默认
  last_fetched_at TEXT,
  last_error TEXT,
  article_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  link TEXT UNIQUE NOT NULL,
  pub_date TEXT NOT NULL,
  source_id INTEGER REFERENCES sources(id),
  category_id INTEGER REFERENCES sources(id),
  fetched_at TEXT NOT NULL,
  summary TEXT
);
CREATE INDEX idx_articles_pub_date ON articles(pub_date DESC);
CREATE INDEX idx_articles_source ON articles(source_id);
CREATE INDEX idx_articles_category ON articles(category_id);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### TypeScript 接口

所有接口定义在 `src/lib/types.ts`：

| 接口 | 用途 |
|------|------|
| `Category` | 分类（id, name, slug, icon, sortOrder, enabled） |
| `Source` | RSS 源（id, name, feedUrl, categoryId, enabled, refreshInterval） |
| `Article` | 文章（id, title, link, pubDate, sourceId, categoryId, summary） |
| `Settings` | 系统设置（fetchInterval, reportTime, articlesPerSource 等） |
| `ArticlesQuery` | 文章查询参数（categoryId, sourceId, page, limit） |
| `ArticlesResponse` | 分页文章响应（articles, total, page, totalPages） |
| `SourceFormData` | 源表单数据 |
| `CategoryFormData` | 分类表单数据 |
| `ImportItem` | 批量导入条目 |
| `TestFeedResult` | Feed 测试结果 |

分类颜色映射通过 `CATEGORY_COLORS` 常量实现，slug → Tailwind 背景色类名。

## 核心模块

### 数据库层（db.ts）

- **单例模式**：全局一个 SQLite 连接，WAL 模式 + 外键约束
- **CRUD 函数**：分类、源、文章、设置的完整增删改查
- **关键查询**：
  - `getArticlesByCategory(categoryId, limit)` — 首页按分类加载
  - `getArticlesBySource(sourceId, page, limit)` — 源详情分页
  - `getArticlesForReport(date)` — 日报数据
  - `cleanup(retentionDays)` — 按天数清理旧文章
- **去重机制**：`INSERT OR IGNORE` 基于 `link` 唯一约束

### 抓取引擎（fetcher.ts）

- **批量并发**：最多 5 个源同时抓取
- **超时控制**：每个源按 `settings.requestTimeout`（默认 10 秒）
- **年龄过滤**：只保存 30 天内的文章
- **错误隔离**：单个源失败不影响其他源，错误记录到 `sources.last_error`
- **状态更新**：每次抓取后更新 `last_fetched_at` 和 `article_count`
- **Feed 测试**：`testFeed(url)` 验证 RSS 可用性并预览最新 5 篇

### 定时任务（scheduler.ts）

管理三个 node-cron 任务：

| 任务 | 默认调度 | 说明 |
|------|----------|------|
| 抓取任务 | 每 30 分钟 | 可通过 `settings.fetchInterval` 调整 |
| 日报生成 | 每天 08:00 | 可通过 `settings.reportTime` 调整 |
| 文章清理 | 每天 03:00 | 仅 `settings.retentionEnabled=true` 时运行 |

修改设置后自动重新调度相关任务。

### 报告生成（reporter.ts）

- 输出路径：`output/YYYY-MM-DD-ai-news.md`
- 按分类 → 源 → 时间降序分组
- 可通过 `/api/report` 手动触发

## 数据流

```
首页加载:
  浏览器 → GET /api/news?categoryId=X → db.getArticlesByCategory()
         → 前端按 sourceId 分组 → SourceBlock 渲染

源详情:
  浏览器 → GET /api/news?sourceId=X&page=N → db.getArticlesBySource()
         → Pagination 分页渲染

手动抓取:
  浏览器 → POST /api/fetch → fetchAllSources()
         → 并发抓取 → INSERT OR IGNORE → 返回统计

日报:
  定时/手动 → generateReport() → 查询当日文章
           → 按分类+源分组 → 写 Markdown 文件
```

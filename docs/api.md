# API 参考

## 公开接口

### GET /api/news

获取文章列表，支持分类、源和分页筛选。

**参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `categoryId` | number | - | 按分类筛选 |
| `sourceId` | number | - | 按源筛选 |
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页条数 |

**响应**

```json
{
  "articles": [
    {
      "id": 1,
      "title": "文章标题",
      "link": "https://...",
      "pubDate": "2026-04-10T08:00:00Z",
      "sourceId": 1,
      "categoryId": 1,
      "fetchedAt": "2026-04-10T08:30:00Z",
      "summary": "摘要...",
      "sourceName": "源名称",
      "categoryName": "分类名称"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

---

### POST /api/fetch

触发 RSS 抓取（手动）。

**请求体**（可选）

```json
{ "sourceId": 1 }
```

不传 `sourceId` 则抓取所有启用的源。

**响应**

```json
{
  "fetched": 42,
  "errors": ["源名称: 超时"]
}
```

---

### GET /api/report

生成或下载 Markdown 日报。

**参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `date` | string | 今天 | 日期，格式 `YYYY-MM-DD` |

**响应**：Markdown 文本（`text/markdown`）

---

## 管理接口

所有 `/api/admin/*` 接口需要通过 Cookie 携带有效的 admin token。

### POST /api/admin/login

管理员登录。

**请求体**

```json
{ "password": "your-password" }
```

**响应**：设置 `admin_token` Cookie，重定向到 `/admin`。

---

### 源管理

#### GET /api/admin/sources

获取所有源列表（含分类名称）。

**响应**：Source 对象数组。

#### POST /api/admin/sources

创建新源。

**请求体**

```json
{
  "name": "源名称",
  "feedUrl": "https://example.com/rss",
  "siteUrl": "https://example.com",
  "categoryId": 1,
  "refreshInterval": 0,
  "enabled": true
}
```

#### PUT /api/admin/sources/[id]

更新指定源。

#### DELETE /api/admin/sources/[id]

删除指定源。

---

### Feed 测试

#### POST /api/admin/test-feed

测试 RSS URL 是否有效。

**请求体**

```json
{ "url": "https://example.com/rss" }
```

**响应**

```json
{
  "valid": true,
  "title": "Feed 标题",
  "articles": [
    { "title": "最新文章", "link": "https://...", "pubDate": "..." }
  ]
}
```

---

### 批量导入

#### POST /api/admin/import

批量导入源。

**请求体**

```json
[
  { "name": "源名称", "feedUrl": "https://...", "category": "ai-llm" }
]
```

`category` 支持分类 slug 或名称。

**响应**

```json
{
  "imported": 5,
  "errors": ["源名称: 分类不存在"]
}
```

---

### 分类管理

#### GET /api/admin/categories

获取所有分类（按 sort_order 排序）。

#### POST /api/admin/categories

创建分类。`slug` 可选（自动从 name 生成）。

**请求体**

```json
{
  "name": "新分类",
  "slug": "new-category",
  "icon": "📌",
  "enabled": true
}
```

#### PUT /api/admin/categories/[id]

更新指定分类。

#### DELETE /api/admin/categories/[id]

删除指定分类。

#### PATCH /api/admin/categories/reorder

批量调整分类排序。

**请求体**

```json
{ "order": [3, 1, 2, 5, 4] }
```

数组为分类 ID 的新顺序。

---

### 系统设置

#### GET /api/admin/settings

获取所有设置。

**响应**

```json
{
  "fetchInterval": "30",
  "reportTime": "08:00",
  "articlesPerSource": "10",
  "retentionDays": "30",
  "requestTimeout": "10",
  "autoFetch": "true",
  "retentionEnabled": "false"
}
```

> 设置以 key-value 字符串形式存储在 `settings` 表中。

#### PUT /api/admin/settings

批量更新设置。修改抓取相关设置后定时任务自动重启。

**请求体**

```json
{
  "fetchInterval": "15",
  "reportTime": "09:00"
}
```

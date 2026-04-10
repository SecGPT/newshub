import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type {
  Category,
  Source,
  Article,
  Settings,
  ArticlesQuery,
  ArticlesResponse,
  CategoryFormData,
  SourceFormData,
} from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

let db: Database.Database | null = null;

export function initDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'news.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);
  return db;
}

export function getDb(): Database.Database {
  if (!db) return initDb();
  return db;
}

function createTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      feed_url TEXT UNIQUE NOT NULL,
      site_url TEXT,
      category_id INTEGER REFERENCES categories(id),
      enabled INTEGER DEFAULT 1,
      refresh_interval INTEGER DEFAULT 0,
      last_fetched_at TEXT,
      last_error TEXT,
      article_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      link TEXT UNIQUE NOT NULL,
      pub_date TEXT NOT NULL,
      source_id INTEGER REFERENCES sources(id),
      category_id INTEGER REFERENCES categories(id),
      fetched_at TEXT NOT NULL,
      summary TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// ===== Admin Auth =====

export function isAdmin(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  if (!match) return false;

  const expectedToken = hashToken(process.env.ADMIN_PASSWORD || 'admin');
  return match[1] === expectedToken;
}

function hashToken(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ===== Helpers =====

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    icon: (row.icon as string) || undefined,
    sortOrder: (row.sort_order as number) || 0,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSource(row: Record<string, unknown>): Source {
  return {
    id: row.id as number,
    name: row.name as string,
    feedUrl: row.feed_url as string,
    siteUrl: (row.site_url as string) || undefined,
    categoryId: (row.category_id as number) || 0,
    enabled: Boolean(row.enabled),
    refreshInterval: (row.refresh_interval as number) || 0,
    lastFetchedAt: (row.last_fetched_at as string) || undefined,
    lastError: (row.last_error as string) || undefined,
    articleCount: (row.article_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as number,
    title: row.title as string,
    link: row.link as string,
    pubDate: row.pub_date as string,
    sourceId: row.source_id as number,
    categoryId: (row.category_id as number) || 0,
    fetchedAt: row.fetched_at as string,
    summary: (row.summary as string) || undefined,
    sourceName: (row.source_name as string) || undefined,
    categoryName: (row.category_name as string) || undefined,
  };
}

function nowISO(): string {
  return new Date().toISOString();
}

// ===== Categories CRUD =====

export function getCategories(): Category[] {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all() as Record<string, unknown>[];
  return rows.map(rowToCategory);
}

export function getCategoryById(id: number): Category | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToCategory(row) : undefined;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as Record<string, unknown> | undefined;
  return row ? rowToCategory(row) : undefined;
}

export function createCategory(data: CategoryFormData): Category {
  const database = getDb();
  const now = nowISO();
  const slug = data.slug || generateSlug(data.name);
  const stmt = database.prepare(`
    INSERT INTO categories (name, slug, icon, sort_order, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    slug,
    data.icon || null,
    data.sortOrder || 0,
    data.enabled !== false ? 1 : 0,
    now,
    now
  );
  return getCategoryById(result.lastInsertRowid as number)!;
}

export function updateCategory(id: number, data: CategoryFormData): Category | undefined {
  const database = getDb();
  const existing = getCategoryById(id);
  if (!existing) return undefined;

  const now = nowISO();
  const slug = data.slug || existing.slug;
  const stmt = database.prepare(`
    UPDATE categories SET name = ?, slug = ?, icon = ?, sort_order = ?, enabled = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    data.name || existing.name,
    slug,
    data.icon !== undefined ? data.icon || null : existing.icon || null,
    data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
    data.enabled !== undefined ? (data.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
    now,
    id
  );
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const database = getDb();
  // Check if any sources are assigned to this category
  const sourceCount = database.prepare('SELECT COUNT(*) as cnt FROM sources WHERE category_id = ?').get(id) as Record<string, unknown>;
  if ((sourceCount.cnt as number) > 0) {
    return false;
  }
  const result = database.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderCategories(orderedIds: number[]): void {
  const database = getDb();
  const stmt = database.prepare('UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?');
  const now = nowISO();
  const transaction = database.transaction(() => {
    for (let i = 0; i < orderedIds.length; i++) {
      stmt.run(i, now, orderedIds[i]);
    }
  });
  transaction();
}

// ===== Sources CRUD =====

export function getSources(enabledOnly?: boolean): Source[] {
  const database = getDb();
  const sql = enabledOnly
    ? 'SELECT * FROM sources WHERE enabled = 1 ORDER BY name ASC'
    : 'SELECT * FROM sources ORDER BY name ASC';
  const rows = database.prepare(sql).all() as Record<string, unknown>[];
  return rows.map(rowToSource);
}

export function getSourceById(id: number): Source | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM sources WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToSource(row) : undefined;
}

export function getSourcesByCategory(categoryId: number): Source[] {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM sources WHERE category_id = ? ORDER BY name ASC').all(categoryId) as Record<string, unknown>[];
  return rows.map(rowToSource);
}

export function createSource(data: SourceFormData): Source {
  const database = getDb();
  const now = nowISO();
  const stmt = database.prepare(`
    INSERT INTO sources (name, feed_url, site_url, category_id, enabled, refresh_interval, article_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.feedUrl,
    data.siteUrl || null,
    data.categoryId,
    data.enabled !== false ? 1 : 0,
    data.refreshInterval || 0,
    now,
    now
  );
  return getSourceById(result.lastInsertRowid as number)!;
}

export function updateSource(id: number, data: SourceFormData): Source | undefined {
  const database = getDb();
  const existing = getSourceById(id);
  if (!existing) return undefined;

  const now = nowISO();
  const stmt = database.prepare(`
    UPDATE sources SET name = ?, feed_url = ?, site_url = ?, category_id = ?, enabled = ?, refresh_interval = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    data.name || existing.name,
    data.feedUrl || existing.feedUrl,
    data.siteUrl !== undefined ? data.siteUrl || null : existing.siteUrl || null,
    data.categoryId !== undefined ? data.categoryId : existing.categoryId,
    data.enabled !== undefined ? (data.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
    data.refreshInterval !== undefined ? data.refreshInterval : existing.refreshInterval,
    now,
    id
  );
  return getSourceById(id);
}

export function deleteSource(id: number): boolean {
  const database = getDb();
  // Delete associated articles first
  database.prepare('DELETE FROM articles WHERE source_id = ?').run(id);
  const result = database.prepare('DELETE FROM sources WHERE id = ?').run(id);
  return result.changes > 0;
}

export function bulkCreateSources(items: SourceFormData[]): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO sources (name, feed_url, site_url, category_id, enabled, refresh_interval, article_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const now = nowISO();
  const transaction = database.transaction(() => {
    let count = 0;
    for (const item of items) {
      const result = stmt.run(
        item.name,
        item.feedUrl,
        item.siteUrl || null,
        item.categoryId,
        item.enabled !== false ? 1 : 0,
        item.refreshInterval || 0,
        now,
        now
      );
      count += result.changes;
    }
    return count;
  });
  return transaction();
}

export function updateSourceFetchMeta(
  id: number,
  meta: { lastFetchedAt: string; lastError?: string; articleCount: number }
): void {
  const database = getDb();
  const now = nowISO();
  database.prepare(`
    UPDATE sources SET last_fetched_at = ?, last_error = ?, article_count = ?, updated_at = ?
    WHERE id = ?
  `).run(meta.lastFetchedAt, meta.lastError || null, meta.articleCount, now, id);
}

// ===== Articles CRUD =====

export function getArticles(query: ArticlesQuery = {}): ArticlesResponse {
  const database = getDb();
  const { categoryId, sourceId, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let params: unknown[] = [];

  if (categoryId) {
    whereClauses.push('a.category_id = ?');
    params.push(categoryId);
  }
  if (sourceId) {
    whereClauses.push('a.source_id = ?');
    params.push(sourceId);
  }

  const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  // Get total count
  const countRow = database.prepare(
    `SELECT COUNT(*) as total FROM articles a ${whereStr}`
  ).get(...params) as Record<string, unknown>;
  const total = countRow.total as number;

  // Get articles with source and category names
  const rows = database.prepare(
    `SELECT a.*, s.name as source_name, c.name as category_name
     FROM articles a
     LEFT JOIN sources s ON a.source_id = s.id
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereStr}
     ORDER BY a.pub_date DESC
     LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Record<string, unknown>[];

  return {
    articles: rows.map(rowToArticle),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export function getArticlesBySource(sourceId: number, page: number = 1, limit: number = 20): ArticlesResponse {
  return getArticles({ sourceId, page, limit });
}

export function insertArticles(articles: Omit<Article, 'id' | 'sourceName' | 'categoryName'>[]): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO articles (title, link, pub_date, source_id, category_id, fetched_at, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = database.transaction(() => {
    let count = 0;
    for (const article of articles) {
      const result = stmt.run(
        article.title,
        article.link,
        article.pubDate,
        article.sourceId,
        article.categoryId,
        article.fetchedAt,
        article.summary || null
      );
      count += result.changes;
    }
    return count;
  });
  return transaction();
}

export function cleanupOldArticles(retentionDays: number): number {
  const database = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString();
  const result = database.prepare('DELETE FROM articles WHERE pub_date < ?').run(cutoffStr);
  return result.changes;
}

// ===== Settings =====

export function getSettings(): Settings {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM settings').all() as Record<string, unknown>[];

  const settingsMap: Record<string, string> = {};
  for (const row of rows) {
    settingsMap[row.key as string] = row.value as string;
  }

  return {
    fetchInterval: settingsMap.fetchInterval ? parseInt(settingsMap.fetchInterval, 10) : DEFAULT_SETTINGS.fetchInterval,
    reportTime: settingsMap.reportTime || DEFAULT_SETTINGS.reportTime,
    articlesPerSource: settingsMap.articlesPerSource ? parseInt(settingsMap.articlesPerSource, 10) : DEFAULT_SETTINGS.articlesPerSource,
    retentionDays: settingsMap.retentionDays ? parseInt(settingsMap.retentionDays, 10) : DEFAULT_SETTINGS.retentionDays,
    requestTimeout: settingsMap.requestTimeout ? parseInt(settingsMap.requestTimeout, 10) : DEFAULT_SETTINGS.requestTimeout,
    autoFetch: settingsMap.autoFetch !== undefined ? settingsMap.autoFetch === 'true' : DEFAULT_SETTINGS.autoFetch,
    retentionEnabled: settingsMap.retentionEnabled !== undefined ? settingsMap.retentionEnabled === 'true' : DEFAULT_SETTINGS.retentionEnabled,
  };
}

export function updateSettings(partial: Partial<Settings>): Settings {
  const database = getDb();
  const now = nowISO();
  const stmt = database.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const transaction = database.transaction(() => {
    for (const [key, value] of Object.entries(partial)) {
      if (value !== undefined) {
        stmt.run(key, String(value), now);
      }
    }
  });
  transaction();

  return getSettings();
}

export function getSetting(key: string): string | undefined {
  const database = getDb();
  const row = database.prepare('SELECT value FROM settings WHERE key = ?').get(key) as Record<string, unknown> | undefined;
  return row ? (row.value as string) : undefined;
}

export function setSetting(key: string, value: string): void {
  const database = getDb();
  const now = nowISO();
  database.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

// ===== Utility =====

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '');
}

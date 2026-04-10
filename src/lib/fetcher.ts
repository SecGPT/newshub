import Parser from 'rss-parser';
import {
  initDb,
  getSources,
  getSourceById,
  insertArticles,
  updateSourceFetchMeta,
  getSettings,
} from '@/lib/db';

function createParser(): Parser {
  const settings = getSettings();
  const timeout = (settings.requestTimeout || 10) * 1000;
  return new Parser({
    timeout,
    requestOptions: {
      timeout,
    },
  });
}

function isWithinLast30Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date >= thirtyDaysAgo;
}

async function fetchSingleSource(sourceId: number): Promise<{ fetched: number; error?: string }> {
  initDb();
  const source = getSourceById(sourceId);
  if (!source) {
    return { fetched: 0, error: `Source with id ${sourceId} not found` };
  }

  const parser = createParser();

  try {
    const feed = await parser.parseURL(source.feedUrl);
    const now = new Date().toISOString();
    const articles: Parameters<typeof insertArticles>[0] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      const pubDate = item.isoDate || item.pubDate || now;
      if (!isWithinLast30Days(pubDate)) continue;

      articles.push({
        title: item.title,
        link: item.link,
        pubDate: new Date(pubDate).toISOString(),
        sourceId: source.id,
        categoryId: source.categoryId,
        fetchedAt: now,
        summary: item.contentSnippet || item.summary || undefined,
      });
    }

    const inserted = insertArticles(articles);

    // Count total articles for this source
    const database = initDb();
    const countRow = database.prepare('SELECT COUNT(*) as cnt FROM articles WHERE source_id = ?').get(source.id) as Record<string, unknown>;
    const totalArticles = (countRow.cnt as number) || 0;

    updateSourceFetchMeta(source.id, {
      lastFetchedAt: now,
      lastError: undefined,
      articleCount: totalArticles,
    });

    return { fetched: inserted };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const now = new Date().toISOString();

    // Update source with error but preserve existing article count
    updateSourceFetchMeta(source.id, {
      lastFetchedAt: now,
      lastError: errorMsg,
      articleCount: source.articleCount,
    });

    return { fetched: 0, error: `${source.name}: ${errorMsg}` };
  }
}

async function fetchWithConcurrency(
  sourceIds: number[],
  concurrency: number
): Promise<{ fetched: number; errors: string[] }> {
  let totalFetched = 0;
  const errors: string[] = [];
  let index = 0;

  async function worker() {
    while (index < sourceIds.length) {
      const currentIndex = index++;
      const sourceId = sourceIds[currentIndex];
      const result = await fetchSingleSource(sourceId);
      totalFetched += result.fetched;
      if (result.error) {
        errors.push(result.error);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, sourceIds.length) }, () => worker());
  await Promise.all(workers);

  return { fetched: totalFetched, errors };
}

export async function fetchAllSources(): Promise<{ fetched: number; errors: string[] }> {
  initDb();
  const enabledSources = getSources(true);

  if (enabledSources.length === 0) {
    return { fetched: 0, errors: [] };
  }

  const sourceIds = enabledSources.map((s) => s.id);
  return fetchWithConcurrency(sourceIds, 5);
}

export async function fetchSource(sourceId: number): Promise<{ fetched: number; error?: string }> {
  initDb();
  return fetchSingleSource(sourceId);
}

export async function testFeed(feedUrl: string): Promise<{
  valid: boolean;
  title?: string;
  articles: { title: string; link: string; pubDate: string }[];
  error?: string;
}> {
  try {
    const parser = createParser();
    const feed = await parser.parseURL(feedUrl);

    const articles = feed.items.slice(0, 5).map((item) => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || '',
    }));

    return {
      valid: true,
      title: feed.title,
      articles,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      articles: [],
      error: errorMsg,
    };
  }
}

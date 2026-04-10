import { initDb, getDb } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/types';

interface SeedCategory {
  name: string;
  slug: string;
  icon: string;
}

interface SeedSource {
  name: string;
  feedUrl: string;
  categorySlug: string;
}

const DEFAULT_CATEGORIES: SeedCategory[] = [
  // 国内栏目 (排在前面)
  { name: '新闻热榜', slug: 'news-hot', icon: '🔥' },
  { name: '科技资讯', slug: 'tech-cn', icon: '💻' },
  { name: 'AI 与大模型', slug: 'ai-llm', icon: '🤖' },
  { name: '开发者', slug: 'dev-cn', icon: '👨‍💻' },
  { name: '生活', slug: 'lifestyle', icon: '🌈' },
  { name: '汽车', slug: 'automobile', icon: '🚗' },
  { name: '摩托车', slug: 'motorcycle', icon: '🏍️' },
  // 国际栏目 (排在后面)
  { name: 'AI Research', slug: 'ai-research', icon: '🔬' },
  { name: 'AI Products', slug: 'ai-products', icon: '💡' },
  { name: 'AI Ethics', slug: 'ai-ethics', icon: '⚖️' },
];

const DEFAULT_SOURCES: SeedSource[] = [
  // ========== 国内 - 新闻热榜 ==========
  { name: '知乎热榜', feedUrl: 'https://rsshub.app/zhihu/hotlist', categorySlug: 'news-hot' },
  { name: '微博热搜', feedUrl: 'https://rsshub.app/weibo/search/hot', categorySlug: 'news-hot' },
  { name: '百度热搜', feedUrl: 'https://rsshub.app/baidu/hot', categorySlug: 'news-hot' },
  { name: '今日头条', feedUrl: 'https://rsshub.app/toutiao/hot', categorySlug: 'news-hot' },
  { name: '澎湃热点', feedUrl: 'https://rsshub.app/thepaper/hot', categorySlug: 'news-hot' },
  { name: '澎湃头条', feedUrl: 'https://rsshub.app/thepaper/channel/25950', categorySlug: 'news-hot' },
  { name: '联合早报-中港台', feedUrl: 'https://rsshub.app/zaobao/realtime/china', categorySlug: 'news-hot' },
  { name: '联合早报-国际', feedUrl: 'https://rsshub.app/zaobao/realtime/world', categorySlug: 'news-hot' },
  { name: '观察者网', feedUrl: 'https://rsshub.app/guancha/index', categorySlug: 'news-hot' },
  { name: '南方周末', feedUrl: 'https://rsshub.app/infzm/2', categorySlug: 'news-hot' },
  { name: '财新网', feedUrl: 'https://rsshub.app/caixin/latest', categorySlug: 'news-hot' },
  { name: '丁香园疫情', feedUrl: 'https://rsshub.app/dxy/2019-ncov', categorySlug: 'news-hot' },

  // ========== 国内 - 科技资讯 ==========
  { name: '少数派', feedUrl: 'https://sspai.com/feed', categorySlug: 'tech-cn' },
  { name: '爱范儿', feedUrl: 'https://www.ifanr.com/feed', categorySlug: 'tech-cn' },
  { name: '36氪', feedUrl: 'https://36kr.com/feed', categorySlug: 'tech-cn' },
  { name: '36氪快讯', feedUrl: 'https://rsshub.app/36kr/newsflashes', categorySlug: 'tech-cn' },
  { name: 'IT之家', feedUrl: 'https://www.ithome.com/rss/', categorySlug: 'tech-cn' },
  { name: 'cnBeta', feedUrl: 'https://www.cnbeta.com.tw/backend.php', categorySlug: 'tech-cn' },
  { name: '虎嗅', feedUrl: 'https://rsshub.app/huxiu/article', categorySlug: 'tech-cn' },
  { name: '极客公园', feedUrl: 'https://rsshub.app/geekpark/news', categorySlug: 'tech-cn' },
  { name: '阮一峰博客', feedUrl: 'https://www.ruanyifeng.com/blog/atom.xml', categorySlug: 'tech-cn' },
  { name: '酷壳 CoolShell', feedUrl: 'https://coolshell.cn/feed', categorySlug: 'tech-cn' },
  { name: '机器之心', feedUrl: 'https://rsshub.app/jiqizhixin/article', categorySlug: 'tech-cn' },
  { name: '量子位', feedUrl: 'https://rsshub.app/qbitai/article', categorySlug: 'tech-cn' },
  { name: '少数派 Matrix', feedUrl: 'https://rsshub.app/sspai/matrix', categorySlug: 'tech-cn' },

  // ========== 国内 - AI 与大模型 ==========
  { name: 'HuggingFace Blog', feedUrl: 'https://huggingface.co/blog/feed.xml', categorySlug: 'ai-llm' },
  { name: 'OpenAI Blog', feedUrl: 'https://openai.com/blog/rss/', categorySlug: 'ai-llm' },
  { name: 'Google AI Blog', feedUrl: 'https://blog.google/technology/ai/rss/', categorySlug: 'ai-llm' },
  { name: 'DeepMind Blog', feedUrl: 'https://deepmind.google/blog/rss.xml', categorySlug: 'ai-llm' },
  { name: 'Microsoft Research', feedUrl: 'https://www.microsoft.com/en-us/research/feed/', categorySlug: 'ai-llm' },
  { name: 'Anthropic News', feedUrl: 'https://www.anthropic.com/rss/news', categorySlug: 'ai-llm' },
  { name: 'Meta AI Blog', feedUrl: 'https://ai.meta.com/blog/rss/', categorySlug: 'ai-llm' },
  { name: 'LangChain Blog', feedUrl: 'https://blog.langchain.dev/rss/', categorySlug: 'ai-llm' },
  { name: 'Ollama Blog', feedUrl: 'https://ollama.com/blog/rss.xml', categorySlug: 'ai-llm' },
  { name: 'Papers With Code', feedUrl: 'https://paperswithcode.com/feed', categorySlug: 'ai-llm' },
  { name: 'NVIDIA AI Blog', feedUrl: 'https://blogs.nvidia.com/blog/category/ai-machine-learning/feed/', categorySlug: 'ai-llm' },
  { name: 'TechCrunch AI', feedUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/', categorySlug: 'ai-llm' },
  { name: 'The Verge AI', feedUrl: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', categorySlug: 'ai-llm' },
  { name: 'VentureBeat AI', feedUrl: 'https://venturebeat.com/category/ai/feed/', categorySlug: 'ai-llm' },

  // ========== 国内 - 开发者 ==========
  { name: 'V2EX', feedUrl: 'https://www.v2ex.com/index.xml', categorySlug: 'dev-cn' },
  { name: 'Hacker News', feedUrl: 'https://hnrss.org/newest?q=AI&count=30', categorySlug: 'dev-cn' },
  { name: '掘金前端', feedUrl: 'https://rsshub.app/juejin/trending/frontend/monthly', categorySlug: 'dev-cn' },
  { name: '掘金后端', feedUrl: 'https://rsshub.app/juejin/trending/backend/monthly', categorySlug: 'dev-cn' },
  { name: 'GitHub Blog', feedUrl: 'https://github.blog/feed/', categorySlug: 'dev-cn' },
  { name: 'Stack Overflow Blog', feedUrl: 'https://stackoverflow.blog/feed/', categorySlug: 'dev-cn' },
  { name: 'Dev.to AI', feedUrl: 'https://dev.to/feed/tag/ai', categorySlug: 'dev-cn' },
  { name: 'InfoQ中文', feedUrl: 'https://www.infoq.cn/public/v1/article/list', categorySlug: 'dev-cn' },
  { name: '美团技术团队', feedUrl: 'https://rsshub.app/meituan/tech', categorySlug: 'dev-cn' },

  // ========== 国内 - 生活 ==========
  { name: '知乎日报', feedUrl: 'https://rsshub.app/zhihu/daily', categorySlug: 'lifestyle' },
  { name: '豆瓣热门', feedUrl: 'https://rsshub.app/douban/explore', categorySlug: 'lifestyle' },
  { name: '什么值得买', feedUrl: 'https://rsshub.app/smzdm/ranking/focus', categorySlug: 'lifestyle' },
  { name: '下厨房', feedUrl: 'https://rsshub.app/xiachufang/explore', categorySlug: 'lifestyle' },
  { name: '马蜂窝游记', feedUrl: 'https://rsshub.app/mafengwo/note', categorySlug: 'lifestyle' },
  { name: '煎蛋', feedUrl: 'https://rsshub.app/jandan/article', categorySlug: 'lifestyle' },
  { name: '好奇心日报', feedUrl: 'https://rsshub.app/qdaily', categorySlug: 'lifestyle' },
  { name: '单向空间', feedUrl: 'https://rsshub.app/owspace/read', categorySlug: 'lifestyle' },

  // ========== 国内 - 汽车 ==========
  { name: '汽车之家-新闻', feedUrl: 'https://rsshub.app/autohome/news', categorySlug: 'automobile' },
  { name: '汽车之家-评测', feedUrl: 'https://rsshub.app/autohome/review', categorySlug: 'automobile' },
  { name: '懂车帝-新能源', feedUrl: 'https://rsshub.app/dongchedi/news/25', categorySlug: 'automobile' },
  { name: '懂车帝-评测', feedUrl: 'https://rsshub.app/dongchedi/live', categorySlug: 'automobile' },
  { name: '新浪汽车', feedUrl: 'https://rsshub.app/sina/auto', categorySlug: 'automobile' },
  { name: '名车志', feedUrl: 'https://rsshub.app/cargurus/index', categorySlug: 'automobile' },
  { name: '汽车之家-新能源', feedUrl: 'https://rsshub.app/autohome/ev', categorySlug: 'automobile' },
  { name: '特斯拉资讯', feedUrl: 'https://rsshub.app/tesla/news', categorySlug: 'automobile' },

  // ========== 国内 - 摩托车 ==========
  { name: '摩托欧耶', feedUrl: 'https://rsshub.app/motooy/moto', categorySlug: 'motorcycle' },
  { name: '摩托车之家', feedUrl: 'https://rsshub.app/mtc/home', categorySlug: 'motorcycle' },
  { name: '牛摩网', feedUrl: 'https://rsshub.app/newmotor/news', categorySlug: 'motorcycle' },
  { name: '达摩院', feedUrl: 'https://rsshub.app/dalton/cover', categorySlug: 'motorcycle' },
  { name: '机车咖', feedUrl: 'https://rsshub.app/motoji/toutiao', categorySlug: 'motorcycle' },
  { name: '哈罗摩托', feedUrl: 'https://rsshub.app/hello Moto/featured', categorySlug: 'motorcycle' },

  // ========== 国际 - AI Research (精简) ==========
  { name: 'arXiv AI', feedUrl: 'https://rss.arxiv.org/rss/cs.AI', categorySlug: 'ai-research' },
  { name: 'MIT News AI', feedUrl: 'https://news.mit.edu/topic/mitartificialintelligence2-rss.xml', categorySlug: 'ai-research' },
  { name: 'Stanford AI Lab', feedUrl: 'https://ai.stanford.edu/blog/feed/', categorySlug: 'ai-research' },
  { name: 'Berkeley AI Research', feedUrl: 'https://bair.berkeley.edu/blog/feed.xml', categorySlug: 'ai-research' },

  // ========== 国际 - AI Products (精简) ==========
  { name: 'Wired AI', feedUrl: 'https://www.wired.com/feed/tag/ai/latest/rss', categorySlug: 'ai-products' },
  { name: 'MIT Tech Review', feedUrl: 'https://www.technologyreview.com/feed/', categorySlug: 'ai-products' },
  { name: 'Ars Technica', feedUrl: 'https://feeds.arstechnica.com/arstechnica/features', categorySlug: 'ai-products' },
  { name: 'BBC Tech', feedUrl: 'https://feeds.bbci.co.uk/news/technology/rss.xml', categorySlug: 'ai-products' },
  { name: 'The Guardian Tech', feedUrl: 'https://www.theguardian.com/technology/rss', categorySlug: 'ai-products' },

  // ========== 国际 - AI Ethics (精简) ==========
  { name: 'AI Now Institute', feedUrl: 'https://ainowinstitute.org/feed.xml', categorySlug: 'ai-ethics' },
  { name: 'EFF AI', feedUrl: 'https://www.eff.org/rss/updates/ai', categorySlug: 'ai-ethics' },
  { name: 'Future of Life', feedUrl: 'https://futureoflife.org/feed/', categorySlug: 'ai-ethics' },
  { name: 'AlgorithmWatch', feedUrl: 'https://algorithmwatch.org/en/feed/', categorySlug: 'ai-ethics' },
];

export async function seedDefaults(): Promise<void> {
  const database = initDb();
  const now = new Date().toISOString();

  // Seed categories if empty
  const categoryCount = (database.prepare('SELECT COUNT(*) as cnt FROM categories').get() as Record<string, unknown>).cnt as number;
  if (categoryCount === 0) {
    console.log('[Seed] Seeding default categories...');
    const catStmt = database.prepare(`
      INSERT INTO categories (name, slug, icon, sort_order, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `);
    const insertCategories = database.transaction(() => {
      DEFAULT_CATEGORIES.forEach((cat, index) => {
        catStmt.run(cat.name, cat.slug, cat.icon, index, now, now);
      });
    });
    insertCategories();
    console.log(`[Seed] Inserted ${DEFAULT_CATEGORIES.length} categories`);
  }

  // Seed sources if empty
  const sourceCount = (database.prepare('SELECT COUNT(*) as cnt FROM sources').get() as Record<string, unknown>).cnt as number;
  if (sourceCount === 0) {
    console.log('[Seed] Seeding default sources...');

    // Build slug -> id map
    const catRows = database.prepare('SELECT id, slug FROM categories').all() as Record<string, unknown>[];
    const slugToId: Record<string, number> = {};
    for (const row of catRows) {
      slugToId[row.slug as string] = row.id as number;
    }

    const srcStmt = database.prepare(`
      INSERT OR IGNORE INTO sources (name, feed_url, category_id, enabled, refresh_interval, article_count, created_at, updated_at)
      VALUES (?, ?, ?, 1, 0, 0, ?, ?)
    `);
    const insertSources = database.transaction(() => {
      for (const source of DEFAULT_SOURCES) {
        const categoryId = slugToId[source.categorySlug];
        if (categoryId) {
          srcStmt.run(source.name, source.feedUrl, categoryId, now, now);
        } else {
          console.warn(`[Seed] Category not found for slug: ${source.categorySlug}, skipping source: ${source.name}`);
        }
      }
    });
    insertSources();
    console.log(`[Seed] Inserted ${DEFAULT_SOURCES.length} sources`);
  }

  // Seed settings if empty
  const settingsCount = (database.prepare('SELECT COUNT(*) as cnt FROM settings').get() as Record<string, unknown>).cnt as number;
  if (settingsCount === 0) {
    console.log('[Seed] Seeding default settings...');
    const settingsStmt = database.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    `);
    const insertSettings = database.transaction(() => {
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        settingsStmt.run(key, String(value), now);
      }
    });
    insertSettings();
    console.log('[Seed] Inserted default settings');
  }
}

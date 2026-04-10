import fs from 'fs';
import path from 'path';
import { initDb, getDb } from '@/lib/db';
import type { Article } from '@/lib/types';

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

export async function generateDailyReport(date?: string): Promise<string> {
  initDb();
  const database = getDb();

  const reportDate = date || new Date().toISOString().split('T')[0];
  const startOfDay = `${reportDate}T00:00:00.000Z`;
  const endOfDay = `${reportDate}T23:59:59.999Z`;

  const rows = database.prepare(`
    SELECT a.*, s.name as source_name, c.name as category_name
    FROM articles a
    LEFT JOIN sources s ON a.source_id = s.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.pub_date >= ? AND a.pub_date <= ?
    ORDER BY c.name ASC, s.name ASC, a.pub_date DESC
  `).all(startOfDay, endOfDay) as Record<string, unknown>[];

  const articles = rows.map(rowToArticle);

  // Group by category, then by source
  const grouped: Record<string, Record<string, Article[]>> = {};
  for (const article of articles) {
    const catName = article.categoryName || 'Uncategorized';
    const srcName = article.sourceName || 'Unknown';
    if (!grouped[catName]) grouped[catName] = {};
    if (!grouped[catName][srcName]) grouped[catName][srcName] = [];
    grouped[catName][srcName].push(article);
  }

  // Build markdown
  let md = `# AI News Daily Report - ${reportDate}\n\n`;
  md += `> Generated at ${new Date().toISOString()}\n`;
  md += `> Total articles: ${articles.length}\n\n---\n\n`;

  if (Object.keys(grouped).length === 0) {
    md += `No articles found for ${reportDate}.\n`;
  } else {
    for (const [category, sources] of Object.entries(grouped)) {
      md += `## ${category}\n\n`;
      for (const [source, sourceArticles] of Object.entries(sources)) {
        md += `### ${source}\n\n`;
        for (const article of sourceArticles) {
          const time = new Date(article.pubDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          md += `- **${time}** [${article.title}](${article.link})\n`;
          if (article.summary) {
            md += `  > ${article.summary.replace(/\n/g, ' ').slice(0, 200)}\n`;
          }
        }
        md += '\n';
      }
      md += '---\n\n';
    }
  }

  md += `\n*Total: ${articles.length} articles*\n`;
  md += `*Generated at ${new Date().toISOString()}*\n`;

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'output');
  if (fs.existsSync(outputDir) === false) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${reportDate}-ai-news.md`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, md, 'utf-8');

  return filePath;
}

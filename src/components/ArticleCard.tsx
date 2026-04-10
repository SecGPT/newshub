"use client";

import type { Article } from "@/lib/types";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/types";
import RelativeTime from "./RelativeTime";

interface ArticleCardProps {
  article: Article;
  categorySlug?: string;
}

export default function ArticleCard({ article, categorySlug }: ArticleCardProps) {
  const badgeColor = categorySlug
    ? CATEGORY_COLORS[categorySlug] || DEFAULT_CATEGORY_COLOR
    : DEFAULT_CATEGORY_COLOR;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/50 bg-white dark:bg-[#1a2236] hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-md dark:hover:shadow-blue-500/5 transition-all group"
    >
      <h3 className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
        {article.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        {article.sourceName && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium text-white ${badgeColor}`}>
            {article.sourceName}
          </span>
        )}
        <span className="flex-shrink-0"><RelativeTime dateStr={article.pubDate} /></span>
      </div>
    </a>
  );
}

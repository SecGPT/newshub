"use client";

import type { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";
import Link from "next/link";
import { useState } from "react";

interface SourceBlockProps {
  sourceName: string;
  sourceId: number;
  articles: Article[];
  maxVisible?: number;
  categorySlug?: string;
}

export default function SourceBlock({
  sourceName,
  sourceId,
  articles,
  maxVisible = 10,
  categorySlug,
}: SourceBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleArticles = expanded ? articles : articles.slice(0, maxVisible);
  const hasMore = articles.length > maxVisible;

  if (articles.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
          {sourceName}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({articles.length})</span>
        </h2>
        <Link
          href={`/source/${sourceId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
        >
          查看更多 &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {visibleArticles.map((article) => (
          <ArticleCard key={article.id} article={article} categorySlug={categorySlug} />
        ))}
      </div>
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          展开更多 ({articles.length - maxVisible} 条)
        </button>
      )}
    </section>
  );
}

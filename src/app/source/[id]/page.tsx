"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Article, ArticlesResponse } from "@/lib/types";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import Link from "next/link";

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = Number(params.id);

  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/news?sourceId=${sourceId}&page=${page}&limit=20`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ArticlesResponse = await res.json();
      setArticles(data.articles);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      if (data.articles.length > 0 && data.articles[0].sourceName) {
        setSourceName(data.articles[0].sourceName);
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, [sourceId, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
          >
            &larr; 返回首页
          </Link>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-lg font-bold truncate text-gray-900 dark:text-white">
            {sourceName || "加载中..."}
          </h1>
          {total > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">共 {total} 篇</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg">暂无文章</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </div>
  );
}

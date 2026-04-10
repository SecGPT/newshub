"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category, Article, ArticlesResponse } from "@/lib/types";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import SourceBlock from "@/components/SourceBlock";

interface GroupedArticles {
  [sourceId: number]: {
    sourceName: string;
    categoryId: number;
    articles: Article[];
  };
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [grouped, setGrouped] = useState<GroupedArticles>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch("/api/admin/categories");
        if (catRes.ok) {
          const cats: Category[] = await catRes.json();
          setCategories(cats);
        }
      } catch {
        // Category metadata is optional; tabs will just be empty
      }
    })();
  }, []);

  // Fetch articles when category selection changes
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId !== null) {
        params.set("categoryId", String(selectedCategoryId));
      }
      params.set("limit", "200");
      params.set("page", "1");

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data: ArticlesResponse = await res.json();

      // Group articles by sourceId
      const g: GroupedArticles = {};
      for (const article of data.articles) {
        const sid = article.sourceId;
        if (!g[sid]) {
          g[sid] = {
            sourceName: article.sourceName || `Source ${sid}`,
            categoryId: article.categoryId,
            articles: [],
          };
        }
        g[sid].articles.push(article);
      }
      setGrouped(g);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/fetch", { method: "POST" });
      setLastFetched(new Date().toISOString());
      await fetchArticles();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const getCategorySlug = (categoryId: number): string | undefined => {
    return categories.find((c) => c.id === categoryId)?.slug;
  };

  // Sort source groups by category sort order, then by source id
  const sortedSourceIds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => {
      const catA = grouped[a].categoryId;
      const catB = grouped[b].categoryId;
      const catOrderA = categories.find((c) => c.id === catA)?.sortOrder ?? 999;
      const catOrderB = categories.find((c) => c.id === catB)?.sortOrder ?? 999;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return a - b;
    });

  return (
    <div className="min-h-screen">
      <Header onRefresh={handleRefresh} lastFetched={lastFetched} refreshing={refreshing} />
      <CategoryTabs
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sortedSourceIds.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">暂无文章</p>
            <p className="text-sm">点击右上角"刷新"按钮获取最新文章</p>
          </div>
        ) : (
          sortedSourceIds.map((sourceId) => (
            <SourceBlock
              key={sourceId}
              sourceName={grouped[sourceId].sourceName}
              sourceId={sourceId}
              articles={grouped[sourceId].articles}
              categorySlug={getCategorySlug(grouped[sourceId].categoryId)}
            />
          ))
        )}
      </main>
    </div>
  );
}

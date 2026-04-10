"use client";

import { useState, useEffect } from "react";
import type { Source } from "@/lib/types";

interface Stats {
  totalSources: number;
  totalArticles: number;
  totalCategories: number;
  errorSources: Source[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalSources: 0,
    totalArticles: 0,
    totalCategories: 0,
    errorSources: [],
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [sourcesRes, categoriesRes, articlesRes] = await Promise.all([
        fetch("/api/admin/sources"),
        fetch("/api/admin/categories"),
        fetch("/api/news?limit=1"),
      ]);

      const sources: Source[] = sourcesRes.ok ? await sourcesRes.json() : [];
      const categories = categoriesRes.ok ? await categoriesRes.json() : [];
      const articlesData = articlesRes.ok ? await articlesRes.json() : { total: 0 };

      setStats({
        totalSources: sources.length,
        totalArticles: articlesData.total || 0,
        totalCategories: categories.length,
        errorSources: sources.filter((s) => s.lastError),
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    setFetching(true);
    setMessage("");
    try {
      const res = await fetch("/api/fetch", { method: "POST" });
      const data = await res.json();
      setMessage(`抓取完成: ${data.fetched || 0} 篇新文章${data.errors?.length ? `, ${data.errors.length} 个错误` : ""}`);
      await loadStats();
    } catch {
      setMessage("抓取失败");
    } finally {
      setFetching(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/report?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setMessage(`报告已生成: ${data.path || "output/"}`);
      } else {
        setMessage("生成报告失败");
      }
    } catch {
      setMessage("生成报告失败");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">仪表盘</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">仪表盘</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">数据源</p>
          <p className="text-2xl font-bold mt-1">{stats.totalSources}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">文章总数</p>
          <p className="text-2xl font-bold mt-1">{stats.totalArticles}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">分类</p>
          <p className="text-2xl font-bold mt-1">{stats.totalCategories}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
        <h2 className="text-sm font-semibold mb-3">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFetchAll}
            disabled={fetching}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {fetching && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            立即抓取所有
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {generating && (
              <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            )}
            生成今日报告
          </button>
        </div>
        {message && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>

      {/* Error sources */}
      {stats.errorSources.length > 0 && (
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5">
          <h2 className="text-sm font-semibold mb-3">
            最近错误 ({stats.errorSources.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.errorSources.map((source) => (
              <div
                key={source.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/10"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{source.name}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 break-all">
                    {source.lastError}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

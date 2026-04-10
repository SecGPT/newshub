"use client";

import { useState, useEffect } from "react";
import type { Source, Category, SourceFormData, TestFeedResult, ImportItem } from "@/lib/types";

function formatFixedDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SourceFormData>({
    name: "",
    feedUrl: "",
    siteUrl: "",
    categoryId: 0,
    refreshInterval: 0,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  // Test feed state
  const [testResult, setTestResult] = useState<TestFeedResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/admin/sources"),
        fetch("/api/admin/categories"),
      ]);
      if (sRes.ok) setSources(await sRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      feedUrl: "",
      siteUrl: "",
      categoryId: categories[0]?.id || 0,
      refreshInterval: 0,
      enabled: true,
    });
    setTestResult(null);
    setShowForm(true);
  };

  const openEditForm = (source: Source) => {
    setEditingId(source.id);
    setForm({
      name: source.name,
      feedUrl: source.feedUrl,
      siteUrl: source.siteUrl || "",
      categoryId: source.categoryId,
      refreshInterval: source.refreshInterval,
      enabled: source.enabled,
    });
    setTestResult(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/sources/${editingId}`
        : "/api/admin/sources";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        await loadData();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/sources/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleTestFeed = async () => {
    if (!form.feedUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/test-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: form.feedUrl }),
      });
      const data: TestFeedResult = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ valid: false, articles: [], error: "请求失败" });
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const items: ImportItem[] = JSON.parse(importJson);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: items }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) {
        await loadData();
      }
    } catch (err) {
      setImportResult({ imported: 0, errors: ["JSON 格式错误"] });
    } finally {
      setImporting(false);
    }
  };

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name || "-";

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">数据源管理</h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">数据源管理</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setImportResult(null);
              setImportJson("");
              setShowImport(true);
            }}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            导入
          </button>
          <button
            onClick={openAddForm}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            + 添加数据源
          </button>
        </div>
      </div>

      {/* Sources table */}
      <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/30">
                <th className="text-left px-4 py-2.5 font-medium">名称</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Feed URL</th>
                <th className="text-left px-4 py-2.5 font-medium">分类</th>
                <th className="text-center px-4 py-2.5 font-medium">状态</th>
                <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">文章</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">上次抓取</th>
                <th className="text-right px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className={source.enabled ? "" : "text-gray-400 line-through"}>
                      {source.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className="text-gray-500 text-xs truncate block max-w-[200px]">
                      {source.feedUrl}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                    {getCategoryName(source.categoryId)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {source.lastError ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" title={source.lastError} />
                    ) : source.lastFetchedAt ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell text-gray-600 dark:text-gray-400">
                    {source.articleCount}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-gray-500">
                    {source.lastFetchedAt
                      ? formatFixedDate(source.lastFetchedAt)
                      : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(source)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(source.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    暂无数据源
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">
                {editingId ? "编辑数据源" : "添加数据源"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Feed URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.feedUrl}
                    onChange={(e) => setForm((f) => ({ ...f, feedUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleTestFeed}
                    disabled={testing || !form.feedUrl}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {testing ? "测试中..." : "测试"}
                  </button>
                </div>
              </div>
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    testResult.valid
                      ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {testResult.valid ? (
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        有效: {testResult.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        获取到 {testResult.articles.length} 篇文章
                      </p>
                      {testResult.articles.slice(0, 3).map((a, i) => (
                        <p key={i} className="text-xs text-gray-500 mt-0.5 truncate">
                          - {a.title}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-600 dark:text-red-400">
                      {testResult.error || "无效的 Feed URL"}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">网站 URL (可选)</label>
                <input
                  type="url"
                  value={form.siteUrl || ""}
                  onChange={(e) => setForm((f) => ({ ...f, siteUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">刷新间隔 (分钟)</label>
                  <input
                    type="number"
                    value={form.refreshInterval || 0}
                    onChange={(e) => setForm((f) => ({ ...f, refreshInterval: Number(e.target.value) }))}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">0 = 使用全局默认</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">启用</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.enabled ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm">已启用</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.feedUrl}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-base font-bold mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              确定要删除此数据源吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">批量导入</h2>
              <p className="text-xs text-gray-500 mt-1">
                JSON 格式: [{"{"}"name":"...","feedUrl":"...","category":"slug"{"}"}]
              </p>
            </div>
            <div className="p-5">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={10}
                placeholder='[{"name":"Example","feedUrl":"https://example.com/feed","category":"ai-research"}]'
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {importResult && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                  <p>导入成功: {importResult.imported} 个</p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-1 text-red-500 text-xs">
                      {importResult.errors.map((e, i) => (
                        <p key={i}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importJson}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {importing ? "导入中..." : "导入"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

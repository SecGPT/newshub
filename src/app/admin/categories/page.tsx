"use client";

import { useState, useEffect } from "react";
import type { Category, CategoryFormData, Source } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    icon: "",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/sources"),
      ]);
      if (cRes.ok) {
        const cats: Category[] = await cRes.json();
        setCategories(cats.sort((a, b) => a.sortOrder - b.sortOrder));
      }
      if (sRes.ok) setSources(await sRes.json());
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSourceCount = (categoryId: number) =>
    sources.filter((s) => s.categoryId === categoryId).length;

  const openAddForm = () => {
    setEditingId(null);
    setForm({ name: "", icon: "", enabled: true });
    setShowForm(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      enabled: cat.enabled,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
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
      await fetch(`/api/admin/categories/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleEnabled = async (cat: Category) => {
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !cat.enabled }),
      });
      await loadData();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);

    // Optimistic update
    setCategories(reordered);

    const orderedIds = reordered.map((c) => c.id);
    try {
      await fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch {
      await loadData(); // revert on error
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">分类管理</h1>
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
        <h1 className="text-xl font-bold">分类管理</h1>
        <button
          onClick={openAddForm}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          + 添加分类
        </button>
      </div>

      {/* Inline add/edit form */}
      {showForm && (
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-16">
              <label className="block text-xs font-medium mb-1">图标</label>
              <input
                type="text"
                value={form.icon || ""}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="emoji"
                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium mb-1">名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {editingId && (
              <div className="w-32">
                <label className="block text-xs font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug || ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <label className="flex items-center gap-1.5 pb-0.5">
              <input
                type="checkbox"
                checked={form.enabled ?? true}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">启用</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? "..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list with drag reorder */}
      <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-grab active:cursor-grabbing ${
                dragOverIndex === index && dragIndex !== index
                  ? "border-t-2 border-blue-500"
                  : ""
              } ${dragIndex === index ? "opacity-50" : ""}`}
            >
              {/* Drag handle */}
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
              </svg>

              {/* Icon */}
              <span className="text-lg w-6 text-center flex-shrink-0">
                {cat.icon || ""}
              </span>

              {/* Name & slug */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${!cat.enabled ? "text-gray-400 line-through" : ""}`}>
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400 ml-2">{cat.slug}</span>
              </div>

              {/* Source count */}
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {getSourceCount(cat.id)} 个源
              </span>

              {/* Enabled toggle */}
              <button
                onClick={() => handleToggleEnabled(cat)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  cat.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    cat.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditForm(cat)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="编辑"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              暂无分类
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-base font-bold mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              确定要删除此分类吗？该分类下的数据源将失去分类。
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
    </div>
  );
}

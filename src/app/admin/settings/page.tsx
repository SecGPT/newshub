"use client";

import { useState, useEffect } from "react";
import type { Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "设置已保存" });
      } else {
        setMessage({ type: "error", text: "保存失败" });
      }
    } catch {
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">系统设置</h1>
        <div className="space-y-4 max-w-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">系统设置</h1>

      <div className="max-w-xl space-y-5">
        {/* Fetch interval */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <label className="block text-sm font-medium mb-1">抓取间隔 (分钟)</label>
          <input
            type="number"
            value={settings.fetchInterval}
            onChange={(e) =>
              setSettings((s) => ({ ...s, fetchInterval: Number(e.target.value) }))
            }
            min={1}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">全局默认的 RSS 抓取频率</p>
        </div>

        {/* Auto fetch toggle */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">自动抓取</p>
              <p className="text-xs text-gray-500 mt-0.5">启用后将按设定间隔自动抓取</p>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, autoFetch: !s.autoFetch }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.autoFetch ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  settings.autoFetch ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Report time */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <label className="block text-sm font-medium mb-1">报告生成时间</label>
          <input
            type="time"
            value={settings.reportTime}
            onChange={(e) =>
              setSettings((s) => ({ ...s, reportTime: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">每日自动生成 Markdown 报告的时间</p>
        </div>

        {/* Articles per source */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <label className="block text-sm font-medium mb-1">每源文章数</label>
          <input
            type="number"
            value={settings.articlesPerSource}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                articlesPerSource: Number(e.target.value),
              }))
            }
            min={1}
            max={50}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">首页每个数据源显示的文章数量</p>
        </div>

        {/* Retention */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">自动清理</p>
              <p className="text-xs text-gray-500 mt-0.5">自动删除超过保留天数的旧文章</p>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  retentionEnabled: !s.retentionEnabled,
                }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.retentionEnabled
                  ? "bg-blue-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  settings.retentionEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <label className="block text-sm font-medium mb-1">保留天数</label>
          <input
            type="number"
            value={settings.retentionDays}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                retentionDays: Number(e.target.value),
              }))
            }
            min={1}
            disabled={!settings.retentionEnabled}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Request timeout */}
        <div className="bg-white dark:bg-[#1a2236] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <label className="block text-sm font-medium mb-1">请求超时 (秒)</label>
          <input
            type="number"
            value={settings.requestTimeout}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                requestTimeout: Number(e.target.value),
              }))
            }
            min={1}
            max={60}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">单个数据源抓取请求的超时时间</p>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
          {message && (
            <span
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

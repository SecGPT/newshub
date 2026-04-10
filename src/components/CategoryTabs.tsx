"use client";

import type { Category } from "@/lib/types";

interface CategoryTabsProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  return (
    <div className="sticky top-14 z-20 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2 snap-x snap-mandatory -mb-px">
          <button
            onClick={() => onSelect(null)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors snap-start ${
              selectedId === null
                ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            全部
          </button>
          {categories
            .filter((c) => c.enabled)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors snap-start whitespace-nowrap ${
                  selectedId === cat.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

interface CategoryStat {
  category: string;
  total: number;
}

interface Stats {
  expensesByCategory: CategoryStat[];
}

const BAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-orange-400",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-amber-500",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LAK",
    maximumFractionDigits: 0,
  }).format(amount);
}

function SkeletonBar() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="flex justify-between">
        <div className="h-3.5 w-24 rounded bg-gray-200" />
        <div className="h-3.5 w-16 rounded bg-gray-200" />
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200" />
    </div>
  );
}

interface AnalyticsChartsProps {
  refreshKey?: number;
}

export default function AnalyticsCharts({ refreshKey = 0 }: AnalyticsChartsProps) {
  const [data, setData] = useState<CategoryStat[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (data) setRefreshing(true);
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Stats>;
      })
      .then((s) => {
        setData(s.expensesByCategory);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Expenses by Category</h2>
      </div>

      {error && !data && (
        <p className="text-sm text-red-500">Failed to load chart data.</p>
      )}

      {!data && !error && (
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBar key={i} />)}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <BarChart3 className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No expense data yet</p>
          <p className="mt-1 text-xs text-gray-400">Add expense transactions to see your breakdown.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className={`transition-opacity duration-300 ${refreshing ? "opacity-70" : "opacity-100"}`}>
          <CategoryBars data={data} />
        </div>
      )}
    </div>
  );
}

function CategoryBars({ data }: { data: CategoryStat[] }) {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const max = sorted[0].total;
  const grandTotal = sorted.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-5">
      {sorted.map((item, i) => {
        const pct = max > 0 ? (item.total / max) * 100 : 0;
        const share = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : "0";
        const color = BAR_COLORS[i % BAR_COLORS.length];

        return (
          <div key={item.category}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="font-medium text-gray-700">{item.category}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {share}%
                </span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(item.total)}</span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="text-gray-500">
          {sorted.length} {sorted.length === 1 ? "category" : "categories"}
        </span>
        <span className="font-semibold text-gray-800">
          Total: {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
}

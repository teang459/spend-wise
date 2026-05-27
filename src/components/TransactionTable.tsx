"use client";

import { useState, useMemo } from "react";
import { Trash2, Search, SlidersHorizontal, Calendar } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  category: Category;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: () => void;
}

interface MonthGroup {
  key: string;
  label: string;
  items: Transaction[];
  income: number;
  expense: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LAK",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function TransactionTable({ transactions, onDelete }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const seen = new Map<number, string>();
    for (const t of transactions) seen.set(t.category.id, t.category.name);
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(q);
      const matchesCategory = categoryFilter
        ? t.category.id === parseInt(categoryFilter, 10)
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, categoryFilter]);

  const groups: MonthGroup[] = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = monthKey(t.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => {
        let income = 0;
        let expense = 0;
        for (const t of items) {
          if (t.type === "INCOME") income += t.amount;
          else expense += t.amount;
        }
        return { key, label: monthLabel(key), items, income, expense };
      });
  }, [filtered]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete();
    } catch {
      alert("Failed to delete transaction. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
          >
            <option value="">All categories</option>
            {categories.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table — one section per month */}
          <div className="hidden sm:block">
            {groups.map((g) => (
              <section key={g.key} className="border-b border-gray-100 last:border-b-0">
                <MonthHeader group={g} />
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {g.items.map((t) => (
                      <tr
                        key={t.id}
                        className={`group transition-all duration-300 hover:bg-gray-50 ${
                          deletingId === t.id ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-800">
                          {t.description}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {t.category.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(t.date)}</td>
                        <td className={`px-5 py-3.5 text-right font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                          {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DeleteButton
                            loading={deletingId === t.id}
                            onClick={() => handleDelete(t.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          {/* Mobile card list — one section per month */}
          <div className="sm:hidden">
            {groups.map((g) => (
              <section key={g.key} className="border-b border-gray-100 last:border-b-0">
                <MonthHeader group={g} />
                <div className="divide-y divide-gray-100">
                  {g.items.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start justify-between gap-3 p-4 transition-all duration-300 ${
                        deletingId === t.id ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-800">{t.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {t.category.name}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                          {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                        <DeleteButton
                          loading={deletingId === t.id}
                          onClick={() => handleDelete(t.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthHeader({ group }: { group: MonthGroup }) {
  const net = group.income - group.expense;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/60 px-5 py-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{group.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
          {group.items.length} {group.items.length === 1 ? "transaction" : "transactions"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-green-600">+{formatCurrency(group.income)}</span>
        <span className="text-red-500">-{formatCurrency(group.expense)}</span>
        <span className={`font-semibold ${net >= 0 ? "text-gray-700" : "text-red-500"}`}>
          Net: {net >= 0 ? "+" : "-"}{formatCurrency(Math.abs(net))}
        </span>
      </div>
    </div>
  );
}

function DeleteButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      aria-label="Delete transaction"
    >
      {loading ? (
        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-sm text-gray-400">
      No transactions found.
    </div>
  );
}

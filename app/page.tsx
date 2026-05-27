"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import StatsCards from "@/src/components/StatsCards";
import TransactionForm from "@/src/components/TransactionForm";
import AnalyticsCharts from "@/src/components/AnalyticsCharts";
import TransactionTable from "@/src/components/TransactionTable";

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

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Spend Wise</h1>
            <p className="text-xs text-gray-400">Personal finance tracker</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats row */}
        <StatsCards refreshKey={refreshKey} />

        {/* Middle row: form + chart */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <TransactionForm onSuccess={refresh} />
          <AnalyticsCharts refreshKey={refreshKey} />
        </div>

        {/* Transaction table */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-700">All Transactions</h2>
          {loadingTx ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              Loading transactions…
            </div>
          ) : (
            <TransactionTable transactions={transactions} onDelete={refresh} />
          )}
        </section>
      </main>
    </div>
  );
}

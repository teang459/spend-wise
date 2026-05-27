"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface Stats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-10 w-10 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-8 w-36 rounded bg-gray-200" />
    </div>
  );
}

interface CardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor: string;
}

function StatCard({ label, value, icon, iconBg, valueColor }: CardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-2xl font-bold tracking-tight ${valueColor}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

interface StatsCardsProps {
  refreshKey?: number;
}

export default function StatsCards({ refreshKey = 0 }: StatsCardsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (stats) setRefreshing(true);
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Stats>;
      })
      .then((data) => {
        setStats(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (error && !stats) {
    return (
      <p className="text-sm text-red-500">Failed to load statistics. Please try again.</p>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className={`grid gap-4 transition-opacity duration-300 sm:grid-cols-3 ${refreshing ? "opacity-70" : "opacity-100"}`}>
      <StatCard
        label="Total Income"
        value={stats.totalIncome}
        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        iconBg="bg-green-50"
        valueColor="text-green-600"
      />
      <StatCard
        label="Total Expense"
        value={stats.totalExpense}
        icon={<TrendingDown className="h-5 w-5 text-red-500" />}
        iconBg="bg-red-50"
        valueColor="text-red-500"
      />
      <StatCard
        label="Net Balance"
        value={stats.netBalance}
        icon={<Wallet className="h-5 w-5 text-indigo-600" />}
        iconBg="bg-indigo-50"
        valueColor="text-indigo-600"
      />
    </div>
  );
}

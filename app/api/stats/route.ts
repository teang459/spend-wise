import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const [incomeAgg, expenseAgg, expenseByCategory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpense = expenseAgg._sum.amount ?? 0;
    const netBalance = totalIncome - totalExpense;

    const categoryIds = expenseByCategory.map((g) => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const expensesByCategory = expenseByCategory.map((g) => ({
      category: categoryMap.get(g.categoryId) ?? "Unknown",
      total: g._sum.amount ?? 0,
    }));

    return NextResponse.json({
      totalIncome,
      totalExpense,
      netBalance,
      expensesByCategory,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

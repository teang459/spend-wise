import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "EXPENSE" },
  { name: "Transport", type: "EXPENSE" },
  { name: "Utilities", type: "EXPENSE" },
  { name: "Shopping", type: "EXPENSE" },
  { name: "Salary", type: "INCOME" },
  { name: "Investments", type: "INCOME" },
] as const;

export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    if (categories.length === 0) {
      await prisma.category.createMany({ data: [...DEFAULT_CATEGORIES] });
      categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

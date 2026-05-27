import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", fields: {} },
      { status: 400 }
    );
  }

  const { description, amount, type, date, categoryId } = body;
  const fields: Record<string, string> = {};

  if (typeof description !== "string" || description.trim().length === 0) {
    fields.description = "description is required and must be a non-empty string";
  } else if (description.trim().length > 200) {
    fields.description = "description must be 200 characters or fewer";
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    fields.amount = "amount must be a finite number";
  } else if (amount <= 0) {
    fields.amount = "amount must be greater than 0";
  }

  if (type !== "INCOME" && type !== "EXPENSE") {
    fields.type = "type must be exactly 'INCOME' or 'EXPENSE'";
  }

  if (
    typeof categoryId !== "number" ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    fields.categoryId = "categoryId must be a positive integer";
  }

  let parsedDate: Date | null = null;
  if (date !== undefined && date !== null) {
    parsedDate = new Date(date as string | number | Date);
    if (isNaN(parsedDate.getTime())) {
      fields.date = "date must be a valid ISO date string";
    }
  }

  if (Object.keys(fields).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", fields },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId as number },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: { categoryId: `category with id ${categoryId} does not exist` },
        },
        { status: 400 }
      );
    }

    if (category.type !== type) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: {
            categoryId: `category type (${category.type}) does not match transaction type (${type})`,
          },
        },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: (description as string).trim(),
        amount: amount as number,
        type: type as "INCOME" | "EXPENSE",
        date: parsedDate ?? new Date(),
        categoryId: categoryId as number,
      },
      include: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

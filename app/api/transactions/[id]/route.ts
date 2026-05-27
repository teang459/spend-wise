import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/transactions/[id]">
) {
  try {
    const { id } = await ctx.params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const body = await req.json();
    const { description, amount, type, date, categoryId } = body;

    if (description !== undefined && (typeof description !== "string" || !description.trim())) {
      return NextResponse.json({ error: "description must be a non-empty string" }, { status: 400 });
    }

    if (amount !== undefined && (typeof amount !== "number" || isNaN(amount) || amount <= 0)) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    if (type !== undefined && type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "type must be INCOME or EXPENSE" }, { status: 400 });
    }

    if (categoryId !== undefined && (typeof categoryId !== "number" || isNaN(categoryId))) {
      return NextResponse.json({ error: "categoryId must be a valid number" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(description !== undefined && { description: description.trim() }),
        ...(amount !== undefined && { amount }),
        ...(type !== undefined && { type }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/transactions/[id]">
) {
  try {
    const { id } = await ctx.params;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use server";

import { PaymentMethod } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

function orderNumber() {
  return `SUN-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function createWalkInSaleAction(formData: FormData) {
  await requireAdmin("/admin/walk-in-sale");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map((value) => Number(value));

  if (customerName.length < 2 || !productIds.length || productIds.length !== quantities.length) redirect("/admin/walk-in-sale?error=details");
  if (paymentMethod !== PaymentMethod.CASH && paymentMethod !== PaymentMethod.MPESA) redirect("/admin/walk-in-sale?error=payment");

  const requested = new Map<string, number>();
  for (let index = 0; index < productIds.length; index += 1) {
    const quantity = quantities[index];
    if (!productIds[index] || !Number.isInteger(quantity) || quantity < 1) redirect("/admin/walk-in-sale?error=items");
    requested.set(productIds[index], (requested.get(productIds[index]) ?? 0) + quantity);
  }

  const orderNumberValue = orderNumber();
  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: [...requested.keys()] }, isActive: true } });
    if (products.length !== requested.size) throw new Error("ITEM_UNAVAILABLE");
    const items = products.map((product) => {
      const quantity = requested.get(product.id) ?? 0;
      if (product.stockQuantity < quantity) throw new Error("INSUFFICIENT_STOCK");
      return { product, quantity, totalCents: product.priceCents * quantity };
    });
    const totalCents = items.reduce((total, item) => total + item.totalCents, 0);
    const created = await tx.order.create({
      data: {
        orderNumber: orderNumberValue,
        customerName,
        customerEmail: customerEmail ?? `walkin-${orderNumberValue.toLowerCase()}@sunsparkelectricals.co.ke`,
        customerPhone,
        subtotalCents: totalCents,
        totalCents,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: "PAID",
        status: "COMPLETED",
        items: { create: items.map(({ product, quantity, totalCents: itemTotal }) => ({ productId: product.id, productName: product.name, sku: product.sku, unitCents: product.priceCents, costCents: product.costCents, quantity, totalCents: itemTotal })) },
        invoice: { create: { invoiceNumber: `INV-${orderNumberValue}` } }
      }
    });
    await Promise.all(items.map(({ product, quantity }) => tx.product.update({ where: { id: product.id }, data: { stockQuantity: { decrement: quantity }, stockMovements: { create: { type: "SALE", quantity: -quantity, note: `Walk-in ${orderNumberValue}` } } } })));
    return created;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message === "ITEM_UNAVAILABLE" || message === "INSUFFICIENT_STOCK") redirect("/admin/walk-in-sale?error=stock");
    throw error;
  });

  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/walk-in-sale");
  redirect(`/admin/walk-in-sale/${order.id}/receipt`);
}

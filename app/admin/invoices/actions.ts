"use server";

import { DraftInvoiceKind, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

function reference(kind: DraftInvoiceKind) {
  const prefix = kind === "QUOTATION" ? "QUO" : "INV-DRAFT";
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function orderNumber() {
  return `SUN-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function requestedItems(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map((value) => Number(value));
  if (!productIds.length || productIds.length !== quantities.length) return null;
  const requested = new Map<string, number>();
  for (let index = 0; index < productIds.length; index += 1) {
    const quantity = quantities[index];
    if (!productIds[index] || !Number.isInteger(quantity) || quantity < 1) return null;
    requested.set(productIds[index], (requested.get(productIds[index]) ?? 0) + quantity);
  }
  return requested;
}

async function createSalesDocument(formData: FormData, kind: DraftInvoiceKind) {
  await requireAdmin("/admin/invoices");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH") as PaymentMethod;
  const requested = requestedItems(formData);
  if (customerName.length < 2 || !requested) redirect(`/admin/invoices?error=details&tab=${kind.toLowerCase()}`);

  const products = await prisma.product.findMany({ where: { id: { in: [...requested.keys()] }, isActive: true } });
  if (products.length !== requested.size) redirect(`/admin/invoices?error=items&tab=${kind.toLowerCase()}`);
  const items = products.map((product) => {
    const quantity = requested.get(product.id) ?? 0;
    return { product, quantity, totalCents: product.priceCents * quantity };
  });
  const totalCents = items.reduce((total, item) => total + item.totalCents, 0);
  await prisma.draftInvoice.create({
    data: {
      reference: reference(kind), kind, customerName, customerEmail, customerPhone, paymentMethod, subtotalCents: totalCents, totalCents,
      items: { create: items.map(({ product, quantity, totalCents: itemTotal }) => ({ productId: product.id, productName: product.name, sku: product.sku, unitCents: product.priceCents, costCents: product.costCents, quantity, totalCents: itemTotal })) }
    }
  });
  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices?notice=${kind === "QUOTATION" ? "quotation" : "created"}`);
}

export async function createDraftInvoiceAction(formData: FormData) {
  await createSalesDocument(formData, "INVOICE");
}

export async function createQuotationAction(formData: FormData) {
  await createSalesDocument(formData, "QUOTATION");
}

export async function finalizeDraftInvoiceAction(draftId: string) {
  await requireAdmin("/admin/invoices");
  const draft = await prisma.draftInvoice.findUnique({ where: { id: draftId }, include: { items: true } });
  if (!draft || draft.status !== "DRAFT") redirect("/admin/invoices?error=finalize");
  if (draft.kind !== "INVOICE") redirect("/admin/invoices?error=quote-finalize");
  const saleNumber = orderNumber();
  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: draft.items.map((item) => item.productId) }, isActive: true } });
    if (products.length !== draft.items.length) throw new Error("ITEM_UNAVAILABLE");
    for (const item of draft.items) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product || product.stockQuantity < item.quantity) throw new Error("INSUFFICIENT_STOCK");
    }
    const created = await tx.order.create({
      data: {
        orderNumber: saleNumber, customerName: draft.customerName, customerEmail: draft.customerEmail ?? `invoice-${saleNumber.toLowerCase()}@sunsparkelectricals.co.ke`, customerPhone: draft.customerPhone,
        subtotalCents: draft.subtotalCents, totalCents: draft.totalCents, paymentMethod: draft.paymentMethod, paymentStatus: "PENDING", status: "CONFIRMED",
        items: { create: draft.items.map((item) => ({ productId: item.productId, productName: item.productName, sku: item.sku, unitCents: item.unitCents, costCents: item.costCents, quantity: item.quantity, totalCents: item.totalCents })) },
        invoice: { create: { invoiceNumber: `INV-${saleNumber}` } }
      }
    });
    await Promise.all(draft.items.map((item) => tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity }, stockMovements: { create: { type: "SALE", quantity: -item.quantity, note: `Invoice ${saleNumber}` } } } })));
    await tx.draftInvoice.update({ where: { id: draft.id }, data: { status: "COMPLETED", orderId: created.id } });
    return created;
  }).catch((error: unknown) => {
    if (error instanceof Error && (error.message === "ITEM_UNAVAILABLE" || error.message === "INSUFFICIENT_STOCK")) redirect("/admin/invoices?error=stock");
    throw error;
  });
  revalidatePath("/"); revalidatePath("/store"); revalidatePath("/admin/invoices"); revalidatePath("/admin/orders"); revalidatePath("/admin/products");
  redirect(`/admin/walk-in-sale/${order.id}/receipt`);
}

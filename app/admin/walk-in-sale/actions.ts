"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { requireAdmin } from "@/lib/auth/guards";
import type { Order } from "@/lib/types";

export async function createWalkInSaleAction(formData: FormData) {
  await requireAdmin("/admin/walk-in-sale");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  const productIds = formData.getAll("productId").map(String);
  const optionIds = formData.getAll("productOptionId").map((value) => String(value) || null);
  const quantities = formData.getAll("quantity").map((value) => Number(value));

  if (customerName.length < 2 || !productIds.length || productIds.length !== quantities.length) redirect("/admin/walk-in-sale?error=details");
  if (paymentMethod !== "CASH" && paymentMethod !== "MPESA") redirect("/admin/walk-in-sale?error=payment");

  const requested = new Map<string, { productId: string; productOptionId: string | null; quantity: number }>();
  for (let index = 0; index < productIds.length; index += 1) {
    const quantity = quantities[index];
    if (!productIds[index] || !Number.isInteger(quantity) || quantity < 1) redirect("/admin/walk-in-sale?error=items");
    const productOptionId = optionIds[index] ?? null;
    const key = `${productIds[index]}::${productOptionId ?? ""}`;
    const existing = requested.get(key);
    requested.set(key, {
      productId: productIds[index],
      productOptionId,
      quantity: (existing?.quantity ?? 0) + quantity
    });
  }

  const order = await apiFetch<Order>("/orders/checkout", {
    method: "POST",
    body: JSON.stringify({
      userId: null,
      customerName,
      customerEmail: customerEmail ?? `walkin-${Date.now()}@sunsparkelectricals.co.ke`,
      customerPhone,
      paymentMethod,
      items: [...requested.values()]
    })
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("stock") || message.includes("available")) redirect("/admin/walk-in-sale?error=stock");
    throw error;
  });
  await apiFetch(`/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED", paymentStatus: "PAID" }) });

  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/walk-in-sale");
  redirect(`/admin/walk-in-sale/${order.id}/receipt`);
}

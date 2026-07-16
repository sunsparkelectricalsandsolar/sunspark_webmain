"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@/lib/types";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";

export async function updateOrderAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const returnTo = String(formData.get("returnTo") ?? "/admin/orders");

  await apiFetch(`/admin/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: String(formData.get("status")) as OrderStatus,
      paymentStatus: String(formData.get("paymentStatus")) as PaymentStatus
    })
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  redirect(returnTo.startsWith("/admin/payments") ? "/admin/payments?notice=saved" : "/admin/orders?notice=saved");
}

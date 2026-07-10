"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function updateOrderAction(orderId: string, formData: FormData) {
  await requireAdmin();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: String(formData.get("status")) as OrderStatus,
      paymentStatus: String(formData.get("paymentStatus")) as PaymentStatus
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  redirect("/admin/orders");
}

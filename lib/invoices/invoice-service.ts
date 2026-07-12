import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Order } from "@/lib/types";

export async function getOrderInvoice(orderId: string) {
  try {
    return apiFetch<Order>(`/admin/orders/${orderId}`);
  } catch {
    return null;
  }
}

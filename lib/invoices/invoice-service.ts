import "server-only";

import { prisma } from "@/lib/db";

export async function getOrderInvoice(orderId: string) {
  try {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        invoice: true
      }
    });
  } catch {
    return null;
  }
}

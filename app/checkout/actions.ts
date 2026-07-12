"use server";

import { redirect } from "next/navigation";
import { PaymentMethod } from "@prisma/client";
import { buildWhatsAppCheckoutUrl } from "@/lib/checkout/whatsapp";
import { preventAdminShopping } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/money";
import { createOrderFromCart } from "@/lib/orders/order-service";
import { siteConfig } from "@/lib/site-config";

export async function checkoutAction(formData: FormData) {
  await preventAdminShopping();
  const paymentMethod = String(formData.get("paymentMethod") ?? "WHATSAPP") as PaymentMethod;
  const order = await createOrderFromCart({
    customerName: String(formData.get("customerName") ?? "").trim(),
    customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    customerPhone: String(formData.get("customerPhone") ?? "").trim(),
    deliveryNote: String(formData.get("deliveryNote") ?? "").trim(),
    deliveryLocation: String(formData.get("deliveryLocation") ?? "").trim(),
    deliveryMapUrl: String(formData.get("deliveryMapUrl") ?? "").trim(),
    deliveryLatitude: String(formData.get("deliveryLatitude") ?? "").trim(),
    deliveryLongitude: String(formData.get("deliveryLongitude") ?? "").trim(),
    paymentMethod
  });

  if (paymentMethod === "WHATSAPP") {
    redirect(
      buildWhatsAppCheckoutUrl({
        phone: siteConfig.whatsappPhone,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deliveryNote: order.deliveryNote ?? undefined,
        deliveryLocation: order.deliveryLocation ?? undefined,
        deliveryMapUrl: order.deliveryMapUrl ?? undefined,
        totalLabel: formatMoney(order.totalCents),
        items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity }))
      })
    );
  }

  redirect(`/account/orders/${order.id}`);
}

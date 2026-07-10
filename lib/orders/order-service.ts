import "server-only";

import { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clearCart, getCart } from "@/lib/cart/cart-service";

export type CheckoutInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryNote?: string;
  paymentMethod: PaymentMethod;
};

function makeOrderNumber() {
  return `SUN-${Date.now().toString().slice(-8)}`;
}

export async function createOrderFromCart(input: CheckoutInput) {
  const cart = await getCart();

  if (!cart.items.length) {
    throw new Error("Cart is empty");
  }

  const orderNumber = makeOrderNumber();
  const invoiceNumber = `INV-${orderNumber}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      deliveryNote: input.deliveryNote,
      paymentMethod: input.paymentMethod,
      subtotalCents: cart.subtotalCents,
      totalCents: cart.subtotalCents,
      items: {
        create: cart.items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          unitCents: item.product.priceCents,
          quantity: item.quantity,
          totalCents: item.lineTotalCents
        }))
      },
      invoice: {
        create: { invoiceNumber }
      }
    },
    include: {
      items: true,
      invoice: true
    }
  });

  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.product.id },
      data: {
        stockQuantity: { decrement: item.quantity },
        stockMovements: {
          create: {
            type: "SALE",
            quantity: -item.quantity,
            note: order.orderNumber
          }
        }
      }
    });
  }

  await clearCart();
  return order;
}

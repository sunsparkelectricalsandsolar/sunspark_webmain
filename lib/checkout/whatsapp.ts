type WhatsAppCheckoutInput = {
  phone: string;
  orderNumber: string;
  customerName: string;
  deliveryLocation?: string;
  deliveryMapUrl?: string;
  totalLabel: string;
  items: Array<{ name: string; quantity: number }>;
};

export function buildWhatsAppCheckoutUrl(input: WhatsAppCheckoutInput) {
  const lines = [
    `Hello Sunspark, I would like to place order ${input.orderNumber}.`,
    `Customer: ${input.customerName}`,
    ...(input.deliveryLocation ? [`Location: ${input.deliveryLocation}`] : []),
    ...(input.deliveryMapUrl ? [`Map: ${input.deliveryMapUrl}`] : []),
    `Total: ${input.totalLabel}`,
    "Items:",
    ...input.items.map((item) => `- ${item.name} x${item.quantity}`)
  ];

  return `https://wa.me/${input.phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

import { describe, expect, it } from "vitest";
import { buildWhatsAppCheckoutUrl } from "@/lib/checkout/whatsapp";

describe("buildWhatsAppCheckoutUrl", () => {
  it("builds a prefilled WhatsApp order message", () => {
    const url = buildWhatsAppCheckoutUrl({
      phone: "254703586562",
      orderNumber: "SUN-1001",
      customerName: "Jane Doe",
      totalLabel: "KSH 12,500.00",
      items: [{ name: "Solar Panel", quantity: 1 }]
    });

    expect(url).toContain("https://wa.me/254703586562");
    expect(decodeURIComponent(url)).toContain("SUN-1001");
    expect(decodeURIComponent(url)).toContain("Solar Panel x1");
  });
});

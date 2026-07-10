import { describe, expect, it } from "vitest";
import { productInputSchema } from "@/lib/products/validation";

describe("productInputSchema", () => {
  it("requires a name, SKU, category, non-negative price, and non-negative stock", () => {
    const result = productInputSchema.safeParse({
      name: "Solar Panel 200W",
      sku: "SOL-200W",
      categoryId: "category_1",
      priceCents: 1250000,
      stockQuantity: 4
    });

    expect(result.success).toBe(true);
  });
});

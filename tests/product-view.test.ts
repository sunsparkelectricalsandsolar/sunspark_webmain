import { describe, expect, it } from "vitest";
import { getPrimaryImage } from "@/lib/products/images";

describe("getPrimaryImage", () => {
  it("returns the primary image when a product has multiple images", () => {
    const image = getPrimaryImage([
      { url: "/uploads/products/a.jpg", alt: "Side", isPrimary: false },
      { url: "/uploads/products/b.jpg", alt: "Front", isPrimary: true }
    ]);

    expect(image).toEqual({ url: "/uploads/products/b.jpg", alt: "Front", isPrimary: true });
  });
});

import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats cents as KSH for storefront display", () => {
    expect(formatMoney(125000)).toBe("KSH 1,250.00");
  });
});

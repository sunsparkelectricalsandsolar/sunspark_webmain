import { describe, expect, it } from "vitest";
import { canShop } from "@/lib/auth/roles";

describe("canShop", () => {
  it("prevents admins from using customer shopping flows", () => {
    expect(canShop("ADMIN")).toBe(false);
    expect(canShop("CUSTOMER")).toBe(true);
    expect(canShop(undefined)).toBe(true);
  });
});

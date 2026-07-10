import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("verifies the original password against the hash", async () => {
    const hash = await hashPassword("Password");

    await expect(verifyPassword("Password", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrong", hash)).resolves.toBe(false);
  });
});

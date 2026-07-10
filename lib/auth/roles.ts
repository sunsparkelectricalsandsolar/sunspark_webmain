import type { UserRole } from "@prisma/client";

export function canShop(role: UserRole | undefined) {
  return role !== "ADMIN";
}

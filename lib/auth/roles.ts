import type { UserRole } from "@/lib/generated/prisma";

export function canShop(role: UserRole | undefined) {
  return role !== "ADMIN";
}

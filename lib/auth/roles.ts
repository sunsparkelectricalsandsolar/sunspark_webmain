import type { UserRole } from "@/lib/types";

export function canShop(role: UserRole | undefined) {
  return role !== "ADMIN";
}

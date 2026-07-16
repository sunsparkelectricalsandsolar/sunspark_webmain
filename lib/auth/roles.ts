import type { UserRole } from "@/lib/types";

export function canShop(role: UserRole | undefined) {
  return role !== "ADMIN" && role !== "STAFF";
}

export function canUseBackOffice(role: UserRole | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export function canManageCatalog(role: UserRole | undefined) {
  return role === "ADMIN";
}

import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canShop } from "@/lib/auth/roles";

export async function requireCustomer() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!canShop(session.role)) {
    redirect("/admin");
  }

  return session;
}

export async function preventAdminShopping() {
  const session = await getSession();

  if (session && !canShop(session.role)) {
    redirect("/admin");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return session;
}

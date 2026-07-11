import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canShop } from "@/lib/auth/roles";

export async function requireCustomer(nextPath = "/account") {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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

export async function requireAdmin(nextPath = "/admin") {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

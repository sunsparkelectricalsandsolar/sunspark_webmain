import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function requireCustomer() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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

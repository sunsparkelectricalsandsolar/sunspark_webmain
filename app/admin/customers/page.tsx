import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch, toQueryString } from "@/lib/api/client";
import type { PublicUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const customers = await getCustomers(params?.q);

  return (
    <AdminLayout
      title="Registered Customers"
      subtitle="Review customer accounts and order counts."
      actions={
        <Link className="secondary-btn" href="/admin">
          Dashboard
        </Link>
      }
    >
        <form action="/admin/customers" className="admin-filter">
          <input name="q" defaultValue={params?.q ?? ""} placeholder="Search name, email, phone..." />
          <button type="submit">Search</button>
        </form>
        <div className="admin-table">
          <div className="admin-table-row customer-heading">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Joined</span>
            <span>Orders</span>
          </div>
          {customers.map((customer) => (
            <div className="admin-table-row customer-row" key={customer.id}>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
              <span>{customer.phone ?? "-"}</span>
              <span>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-KE") : "-"}</span>
              <span>
                {(customer.orders ?? 0) > 0 ? (
                  <Link className="table-link" href={`/admin/orders?customerId=${encodeURIComponent(customer.id)}`}>
                    {customer.orders} orders
                  </Link>
                ) : "0"}
              </span>
            </div>
          ))}
          {!customers.length ? <p className="empty-state">No registered customers yet.</p> : null}
        </div>
    </AdminLayout>
  );
}

async function getCustomers(q?: string) {
  const term = q?.trim();
  try {
    return apiFetch<(PublicUser & { orders?: number })[]>(`/admin/customers${toQueryString({ q: term })}`);
  } catch {
    return [];
  }
}

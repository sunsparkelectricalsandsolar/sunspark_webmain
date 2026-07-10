import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await getCustomers();

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
              <span>{customer.createdAt.toLocaleDateString("en-KE")}</span>
              <span>{customer._count.orders}</span>
            </div>
          ))}
          {!customers.length ? <p className="empty-state">No registered customers yet.</p> : null}
        </div>
    </AdminLayout>
  );
}

async function getCustomers() {
  try {
    return prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
  } catch {
    return [];
  }
}

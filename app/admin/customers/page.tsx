import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await getCustomers();

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-heading row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Registered Customers</h1>
          </div>
          <Link className="secondary-btn" href="/admin">
            Dashboard
          </Link>
        </div>
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
      </div>
    </section>
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

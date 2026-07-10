import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await getStats();

  return (
    <AdminLayout
      title={`Welcome, ${admin.name}`}
      subtitle="Monitor Sunspark products, customers, stock, orders, checkout options, and invoices."
      actions={
        <Link className="primary-btn" href="/admin/products/new">
          Add product
        </Link>
      }
    >
        <div className="admin-stats">
          <Stat label="Products" value={stats.products} />
          <Stat label="Orders" value={stats.orders} />
          <Stat label="Customers" value={stats.customers} />
          <Stat label="Low stock" value={stats.lowStock} />
        </div>
        <div className="admin-actions">
          <Link className="secondary-btn" href="/admin/products">
            Manage products
          </Link>
          <Link className="secondary-btn" href="/admin/categories">
            Categories
          </Link>
          <Link className="secondary-btn" href="/admin/customers">
            Customers
          </Link>
        </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function getStats() {
  try {
    const [products, orders, customers, lowStock] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({
        where: {
          stockQuantity: {
            lte: 3
          }
        }
      })
    ]);

    return { products, orders, customers, lowStock };
  } catch {
    return { products: 0, orders: 0, customers: 0, lowStock: 0 };
  }
}

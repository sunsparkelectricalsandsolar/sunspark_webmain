import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await getStats();

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-heading">
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Welcome, {admin.name}</h1>
          <p>Manage Sunspark products, stock, orders, checkout options, and invoices.</p>
        </div>
        <div className="admin-stats">
          <Stat label="Products" value={stats.products} />
          <Stat label="Orders" value={stats.orders} />
          <Stat label="Low stock" value={stats.lowStock} />
        </div>
        <div className="admin-actions">
          <Link className="primary-btn" href="/admin/products/new">
            Add product
          </Link>
          <Link className="secondary-btn" href="/admin/products">
            Manage products
          </Link>
        </div>
      </div>
    </section>
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
    const [products, orders, lowStock] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.product.count({
        where: {
          stockQuantity: {
            lte: 3
          }
        }
      })
    ]);

    return { products, orders, lowStock };
  } catch {
    return { products: 0, orders: 0, lowStock: 0 };
  }
}

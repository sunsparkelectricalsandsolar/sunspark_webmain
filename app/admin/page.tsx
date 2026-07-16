import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch, toQueryString } from "@/lib/api/client";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

type ChartPeriod = "days" | "weeks" | "months";
type ChartMetric = "sales" | "profit" | "orders";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ period?: string; metric?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const period = ["days", "weeks", "months"].includes(String(params?.period)) ? params?.period as ChartPeriod : "days";
  const metric = ["sales", "profit", "orders"].includes(String(params?.metric)) ? params?.metric as ChartMetric : "sales";
  const [stats, summary] = await Promise.all([getStats(), getSalesSummary(period)]);

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
        {params?.error === "permission" ? <p className="admin-feedback error" role="alert">This section is restricted to the owner admin account.</p> : null}
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
          <Link className="secondary-btn" href="/admin/walk-in-sale">
            Walk-in sale
          </Link>
          <Link className="secondary-btn" href="/admin/customers">
            Customers
          </Link>
        </div>
        <SalesChart period={period} metric={metric} summary={summary} />
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
    return await apiFetch<{ products: number; orders: number; customers: number; lowStock: number }>("/admin/stats");
  } catch {
    return { products: 0, orders: 0, customers: 0, lowStock: 0 };
  }
}

async function getSalesSummary(period: ChartPeriod) {
  try {
    return await apiFetch<{
      period: ChartPeriod;
      buckets: { bucket: string; label: string; orders: number; salesCents: number; profitCents: number }[];
    }>(`/admin/sales-summary${toQueryString({ period })}`);
  } catch {
    return { period, buckets: [] };
  }
}

function SalesChart({
  metric,
  period,
  summary
}: {
  metric: ChartMetric;
  period: ChartPeriod;
  summary: Awaited<ReturnType<typeof getSalesSummary>>;
}) {
  const metricLabels: Record<ChartMetric, string> = { sales: "Sales", profit: "Profit", orders: "Orders" };
  const values = summary.buckets.map((bucket) => metric === "orders" ? bucket.orders : metric === "profit" ? bucket.profitCents : bucket.salesCents);
  const max = Math.max(...values, 1);
  const totalSales = summary.buckets.reduce((sum, bucket) => sum + bucket.salesCents, 0);
  const totalProfit = summary.buckets.reduce((sum, bucket) => sum + bucket.profitCents, 0);
  const totalOrders = summary.buckets.reduce((sum, bucket) => sum + bucket.orders, 0);

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-heading">
        <div>
          <span className="eyebrow">Operations snapshot</span>
          <h2>{metricLabels[metric]} trend</h2>
          <p>Quick movement view from completed and active orders, excluding cancelled sales.</p>
        </div>
        <div className="chart-summary">
          <span>{formatMoney(totalSales)}</span>
          <small>Sales</small>
          <span>{formatMoney(totalProfit)}</span>
          <small>Profit</small>
          <span>{totalOrders}</span>
          <small>Orders</small>
        </div>
      </div>
      <div className="chart-controls" aria-label="Sales chart filters">
        {(["days", "weeks", "months"] as ChartPeriod[]).map((item) => (
          <Link className={item === period ? "active" : ""} href={`/admin${toQueryString({ period: item, metric })}`} key={item}>{item}</Link>
        ))}
        {(["sales", "profit", "orders"] as ChartMetric[]).map((item) => (
          <Link className={item === metric ? "active" : ""} href={`/admin${toQueryString({ period, metric: item })}`} key={item}>{item}</Link>
        ))}
      </div>
      <div className="bar-chart" role="img" aria-label={`${metricLabels[metric]} by ${period}`}>
        {summary.buckets.map((bucket) => {
          const value = metric === "orders" ? bucket.orders : metric === "profit" ? bucket.profitCents : bucket.salesCents;
          const height = Math.max(8, Math.round((value / max) * 100));
          return (
            <div className="bar-chart-column" key={bucket.bucket}>
              <div className="bar-chart-track">
                <span style={{ height: `${height}%` }} title={`${bucket.label}: ${metric === "orders" ? value : formatMoney(value)}`} />
              </div>
              <strong>{metric === "orders" ? value : formatMoney(value)}</strong>
              <small>{bucket.label}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

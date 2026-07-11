import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ date?: string }> }) {
  await requireAdmin("/admin/reports");
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params?.date ?? "") ? params!.date! : new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const report = await getDailyReport(date);
  return <AdminLayout title="Daily Reports" subtitle="Sales, revenue, and gross profit based on the buying cost saved with each sold item.">
    <form action="/admin/reports" className="admin-filter"><input defaultValue={date} name="date" type="date" /><button type="submit">Run report</button></form>
    <div className="admin-stats report-stats"><Stat label="Completed sales" value={String(report.orders)} /><Stat label="Revenue" value={formatMoney(report.revenueCents)} /><Stat label="Gross profit" value={formatMoney(report.profitCents)} /></div>
    <div className="admin-table"><div className="admin-table-row report-row heading"><span>Product</span><span>Quantity</span><span>Revenue</span><span>Buying cost</span><span>Profit</span></div>
      {report.items.map((item) => <div className="admin-table-row report-row" key={item.key}><strong>{item.name}</strong><span>{item.quantity}</span><span>{formatMoney(item.revenueCents)}</span><span>{formatMoney(item.costCents)}</span><strong>{formatMoney(item.profitCents)}</strong></div>)}
      {!report.items.length ? <p className="empty-state">No completed sales for this date.</p> : null}
    </div>
  </AdminLayout>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>; }

async function getDailyReport(date: string) {
  const start = new Date(`${date}T00:00:00+03:00`);
  const end = new Date(`${date}T23:59:59.999+03:00`);
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } }, include: { items: true } });
  const lines = new Map<string, { key: string; name: string; quantity: number; revenueCents: number; costCents: number; profitCents: number }>();
  for (const order of orders) for (const item of order.items) {
    const key = item.productId ?? item.productName;
    const existing = lines.get(key) ?? { key, name: item.productName, quantity: 0, revenueCents: 0, costCents: 0, profitCents: 0 };
    existing.quantity += item.quantity; existing.revenueCents += item.totalCents; existing.costCents += item.costCents * item.quantity; existing.profitCents += item.totalCents - item.costCents * item.quantity;
    lines.set(key, existing);
  }
  const items = [...lines.values()].sort((a, b) => b.revenueCents - a.revenueCents);
  return { orders: orders.length, items, revenueCents: items.reduce((total, item) => total + item.revenueCents, 0), profitCents: items.reduce((total, item) => total + item.profitCents, 0) };
}

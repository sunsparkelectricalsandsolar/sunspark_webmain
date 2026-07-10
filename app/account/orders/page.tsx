import Link from "next/link";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireCustomer();
  const orders = await getOrders(user.email);

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <h3>Orders</h3>
        </div>
        <div className="admin-table">
          {orders.map((order) => (
            <div className="admin-table-row order-row" key={order.id}>
              <strong>{order.orderNumber}</strong>
              <span>{order.status}</span>
              <span>{formatMoney(order.totalCents)}</span>
              <Link href={`/account/orders/${order.id}`}>View</Link>
            </div>
          ))}
          {!orders.length ? <p className="empty-state">No orders yet.</p> : null}
        </div>
      </div>
    </section>
  );
}

async function getOrders(email: string) {
  try {
    return prisma.order.findMany({ where: { customerEmail: email }, orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrderAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getOrders();

  return (
    <AdminLayout title="Orders" subtitle="Review order checks, fulfillment status, and payment state.">
      <div className="admin-table">
        <div className="admin-table-row order-admin-heading">
          <span>Order</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Payment</span>
          <span>Status</span>
          <span>Update</span>
        </div>
        {orders.map((order) => (
          <form action={updateOrderAction.bind(null, order.id)} className="admin-table-row order-admin-row" key={order.id}>
            <strong>{order.orderNumber}</strong>
            <span>{order.customerName}<br /><small>{order.customerPhone ?? order.customerEmail}</small></span>
            <span>{formatMoney(order.totalCents)}</span>
            <select name="paymentStatus" defaultValue={order.paymentStatus}>
              <option value="UNPAID">Unpaid</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select name="status" defaultValue={order.status}>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button type="submit">Save</button>
          </form>
        ))}
        {!orders.length ? <p className="empty-state">No orders yet.</p> : null}
      </div>
    </AdminLayout>
  );
}

async function getOrders() {
  try {
    return prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  } catch {
    return [];
  }
}

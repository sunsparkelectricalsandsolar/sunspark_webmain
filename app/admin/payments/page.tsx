import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrderAction } from "../orders/actions";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const orders = await getPaymentOrders();

  return (
    <AdminLayout title="Payments" subtitle="Verify payments and mark WhatsApp/M-Pesa orders as paid, failed, or pending.">
      <div className="admin-table">
        <div className="admin-table-row payment-heading">
          <span>Order</span>
          <span>Method</span>
          <span>Amount</span>
          <span>Payment Status</span>
          <span>Order Status</span>
          <span>Verify</span>
        </div>
        {orders.map((order) => (
          <form action={updateOrderAction.bind(null, order.id)} className="admin-table-row payment-row" key={order.id}>
            <strong>{order.orderNumber}</strong>
            <span>{order.paymentMethod}</span>
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
            <button type="submit">Update</button>
          </form>
        ))}
        {!orders.length ? <p className="empty-state">No payments to verify yet.</p> : null}
      </div>
    </AdminLayout>
  );
}

async function getPaymentOrders() {
  try {
    return prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  } catch {
    return [];
  }
}

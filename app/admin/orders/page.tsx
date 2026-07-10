import { AdminLayout } from "@/components/admin/admin-layout";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrderAction } from "./actions";

export const dynamic = "force-dynamic";
const orderStatuses = Object.values(OrderStatus);
const paymentStatuses = Object.values(PaymentStatus);

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; paymentStatus?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const orders = await getOrders({
    paymentStatus: params?.paymentStatus,
    q: params?.q,
    status: params?.status
  });

  return (
    <AdminLayout title="Orders" subtitle="Review order checks, fulfillment status, and payment state.">
      <form action="/admin/orders" className="admin-filter">
        <input name="q" defaultValue={params?.q ?? ""} placeholder="Search order, customer, email, phone..." />
        <select name="status" defaultValue={params?.status ?? ""}>
          <option value="">All order status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="paymentStatus" defaultValue={params?.paymentStatus ?? ""}>
          <option value="">All payment status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button type="submit">Filter</button>
      </form>
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
            <input name="returnTo" type="hidden" value="/admin/orders" />
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

async function getOrders(input: { q?: string; status?: string; paymentStatus?: string }) {
  const terms = input.q?.trim().split(/\s+/).filter(Boolean) ?? [];
  try {
    return prisma.order.findMany({
      where: {
        ...(terms.length
          ? {
              AND: terms.map((term) => ({
                OR: [
                  { orderNumber: { contains: term } },
                  { customerName: { contains: term } },
                  { customerEmail: { contains: term } },
                  { customerPhone: { contains: term } }
                ]
              }))
            }
          : {}),
        ...(orderStatuses.includes(input.status as OrderStatus) ? { status: input.status as OrderStatus } : {}),
        ...(paymentStatuses.includes(input.paymentStatus as PaymentStatus)
          ? { paymentStatus: input.paymentStatus as PaymentStatus }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  } catch {
    return [];
  }
}

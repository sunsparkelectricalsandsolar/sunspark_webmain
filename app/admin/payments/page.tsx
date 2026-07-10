import { AdminLayout } from "@/components/admin/admin-layout";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrderAction } from "../orders/actions";

export const dynamic = "force-dynamic";
const paymentMethods = Object.values(PaymentMethod);
const paymentStatuses = Object.values(PaymentStatus);

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; paymentStatus?: string; method?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const orders = await getPaymentOrders({
    method: params?.method,
    paymentStatus: params?.paymentStatus,
    q: params?.q
  });

  return (
    <AdminLayout title="Payments" subtitle="Verify payments and mark WhatsApp/M-Pesa orders as paid, failed, or pending.">
      <form action="/admin/payments" className="admin-filter">
        <input name="q" defaultValue={params?.q ?? ""} placeholder="Search order, customer, email, phone..." />
        <select name="method" defaultValue={params?.method ?? ""}>
          <option value="">All methods</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="MPESA">M-Pesa</option>
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
            <input name="returnTo" type="hidden" value="/admin/payments" />
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

async function getPaymentOrders(input: { q?: string; paymentStatus?: string; method?: string }) {
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
        ...(paymentMethods.includes(input.method as PaymentMethod) ? { paymentMethod: input.method as PaymentMethod } : {}),
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

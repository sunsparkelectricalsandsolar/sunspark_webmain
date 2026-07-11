import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PrintReceiptButton } from "@/components/admin/print-receipt-button";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function WalkInReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/walk-in-sale/${id}/receipt`);
  const order = await prisma.order.findUnique({ where: { id }, include: { invoice: true, items: true } });
  if (!order) notFound();

  return <AdminLayout title="Sale Complete" subtitle="The sale is recorded, stock is updated, and the receipt is ready.">
    <div className="receipt-actions"><PrintReceiptButton /></div>
    <article className="receipt" id="walk-in-receipt">
      <header><strong>Sunspark Electrical & Solar</strong><span>Receipt</span></header>
      <div className="receipt-meta"><span>{order.invoice?.invoiceNumber}</span><span>{order.createdAt.toLocaleString("en-KE")}</span></div>
      <div className="receipt-customer"><strong>{order.customerName}</strong>{order.customerPhone ? <span>{order.customerPhone}</span> : null}<span>{order.paymentMethod === "CASH" ? "Cash" : "M-Pesa"} · Paid</span></div>
      <div className="receipt-items">
        {order.items.map((item) => <div key={item.id}><span>{item.productName} <small>x{item.quantity}</small></span><strong>{formatMoney(item.totalCents)}</strong></div>)}
      </div>
      <footer><span>Total</span><strong>{formatMoney(order.totalCents)}</strong></footer>
    </article>
  </AdminLayout>;
}

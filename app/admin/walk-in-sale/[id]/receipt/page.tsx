import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PrintReceiptButton } from "@/components/admin/print-receipt-button";
import { SalesDocument } from "@/components/admin/sales-document";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WalkInReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/walk-in-sale/${id}/receipt`);
  const order = await prisma.order.findUnique({ where: { id }, include: { invoice: true, items: true } });
  if (!order) notFound();
  const paymentLabel = order.paymentMethod === "CASH" ? "Cash" : order.paymentMethod === "MPESA" ? "M-Pesa" : "WhatsApp";
  const title = order.paymentStatus === "PAID" ? "Receipt" : "Invoice";

  return <AdminLayout title="Sale Complete" subtitle="The sale is recorded, stock is updated, and the document is ready.">
    <div className="receipt-actions"><PrintReceiptButton label={`Print ${title.toLowerCase()}`} /></div>
    <SalesDocument
      customerEmail={order.customerEmail}
      customerName={order.customerName}
      customerPhone={order.customerPhone}
      date={order.createdAt}
      items={order.items}
      kind={title.toUpperCase() as "RECEIPT" | "INVOICE"}
      number={order.invoice?.invoiceNumber}
      paymentLabel={paymentLabel}
      statusLabel={order.paymentStatus === "PAID" ? "Paid" : "Awaiting payment"}
      subtotalCents={order.subtotalCents}
      totalCents={order.totalCents}
    />
  </AdminLayout>;
}

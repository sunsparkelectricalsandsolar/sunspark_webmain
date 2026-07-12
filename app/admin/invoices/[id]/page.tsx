import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PrintReceiptButton } from "@/components/admin/print-receipt-button";
import { SalesDocument } from "@/components/admin/sales-document";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/invoices/${id}`);
  const document = await apiFetch<Order>(`/admin/orders/${id}`).catch(() => null);
  if (!document) notFound();
  const title = "Invoice";
  const paymentLabel = document.paymentMethod === "CASH" ? "Cash" : document.paymentMethod === "MPESA" ? "M-Pesa" : "WhatsApp";

  return (
    <AdminLayout title={title} subtitle="Review the customer document before printing or sharing.">
      <div className="receipt-actions"><PrintReceiptButton label={`Print ${title.toLowerCase()}`} /></div>
      <SalesDocument
        customerEmail={document.customerEmail}
        customerName={document.customerName}
        customerPhone={document.customerPhone}
        date={document.createdAt}
        items={document.items ?? []}
        kind="INVOICE"
        number={document.invoice?.invoiceNumber ?? document.orderNumber}
        paymentLabel={paymentLabel}
        statusLabel={document.status}
        subtotalCents={document.subtotalCents}
        totalCents={document.totalCents}
      />
    </AdminLayout>
  );
}

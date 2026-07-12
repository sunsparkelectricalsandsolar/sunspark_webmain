import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PrintReceiptButton } from "@/components/admin/print-receipt-button";
import { SalesDocument } from "@/components/admin/sales-document";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/invoices/${id}`);
  const document = await prisma.draftInvoice.findUnique({ where: { id }, include: { items: true } });
  if (!document) notFound();
  const title = document.kind === "QUOTATION" ? "Quotation" : "Invoice";
  const paymentLabel = document.paymentMethod === "CASH" ? "Cash" : document.paymentMethod === "MPESA" ? "M-Pesa" : "WhatsApp";

  return (
    <AdminLayout title={title} subtitle="Review the customer document before printing or sharing.">
      <div className="receipt-actions"><PrintReceiptButton label={`Print ${title.toLowerCase()}`} /></div>
      <SalesDocument
        customerEmail={document.customerEmail}
        customerName={document.customerName}
        customerPhone={document.customerPhone}
        date={document.createdAt}
        items={document.items}
        kind={document.kind}
        number={document.reference}
        paymentLabel={paymentLabel}
        statusLabel={document.status === "DRAFT" ? "Draft" : document.status === "COMPLETED" ? "Completed" : "Cancelled"}
        subtotalCents={document.subtotalCents}
        totalCents={document.totalCents}
      />
    </AdminLayout>
  );
}

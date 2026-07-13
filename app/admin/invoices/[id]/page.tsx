import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PrintReceiptButton } from "@/components/admin/print-receipt-button";
import { SalesDocument } from "@/components/admin/sales-document";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { DraftInvoiceKind, DraftInvoiceStatus, OrderItem, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/invoices/${id}`);
  const document = await apiFetch<{
    id: string;
    reference: string;
    kind: DraftInvoiceKind;
    status: DraftInvoiceStatus;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    paymentMethod: PaymentMethod;
    subtotalCents: number;
    totalCents: number;
    createdAt: Date | string;
    items: OrderItem[];
  }>(`/admin/draft-documents/${id}`).catch(() => null);
  if (!document) notFound();
  const title = document.kind === "QUOTATION" ? "Quotation" : "Invoice";
  const paymentLabel = document.paymentMethod === "CASH" ? "Cash" : document.paymentMethod === "MPESA" ? "M-Pesa" : "WhatsApp";

  return (
    <AdminLayout title={title} subtitle="Review the customer document before printing or sharing.">
      <div className="receipt-actions">{document.status === "DRAFT" ? <Link className="secondary-btn" href={`/admin/invoices/${document.id}/edit`}>Edit {title.toLowerCase()}</Link> : null}<PrintReceiptButton label={`Download ${title.toLowerCase()} PDF`} /></div>
      <SalesDocument
        customerEmail={document.customerEmail}
        customerName={document.customerName}
        customerPhone={document.customerPhone}
        date={document.createdAt}
        items={document.items ?? []}
        kind={document.kind}
        number={document.reference}
        paymentLabel={paymentLabel}
        statusLabel={document.status}
        subtotalCents={document.subtotalCents}
        totalCents={document.totalCents}
      />
    </AdminLayout>
  );
}

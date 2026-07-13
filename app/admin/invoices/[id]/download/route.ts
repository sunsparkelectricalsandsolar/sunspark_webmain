import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import { createSalesDocumentPdf, salesDocumentFilename } from "@/lib/pdf/sales-document-pdf";
import type { DraftInvoiceKind, DraftInvoiceStatus, OrderItem, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  }>(`/admin/draft-documents/${id}`);

  const paymentLabel = document.paymentMethod === "CASH" ? "Cash" : document.paymentMethod === "MPESA" ? "M-Pesa" : "WhatsApp";
  const pdf = createSalesDocumentPdf({
    customerEmail: document.customerEmail,
    customerName: document.customerName,
    customerPhone: document.customerPhone,
    date: document.createdAt,
    items: document.items ?? [],
    kind: document.kind,
    number: document.reference,
    paymentLabel,
    statusLabel: document.status,
    subtotalCents: document.subtotalCents,
    totalCents: document.totalCents
  });

  return new NextResponse(pdf, {
    headers: {
      "content-disposition": `attachment; filename="${salesDocumentFilename({ kind: document.kind, number: document.reference, customerName: document.customerName })}"`,
      "content-type": "application/pdf"
    }
  });
}

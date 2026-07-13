import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WalkInSaleForm } from "@/components/admin/walk-in-sale-form";
import { updateDraftDocumentAction } from "@/app/admin/invoices/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { DraftInvoiceKind, DraftInvoiceStatus, OrderItem, PaymentMethod, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  details: "Enter the customer and at least one item.",
  items: "One or more selected products are unavailable."
};

export default async function EditInvoiceDocumentPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireAdmin(`/admin/invoices/${id}/edit`);
  const [document, products] = await Promise.all([
    apiFetch<{
      id: string;
      reference: string;
      kind: DraftInvoiceKind;
      status: DraftInvoiceStatus;
      customerName: string;
      customerEmail: string | null;
      customerPhone: string | null;
      paymentMethod: PaymentMethod;
      items: OrderItem[];
    }>(`/admin/draft-documents/${id}`).catch(() => null),
    apiFetch<Product[]>("/products?limit=500").catch(() => [])
  ]);

  if (!document || document.status !== "DRAFT") notFound();

  return (
    <AdminLayout title={`Edit ${document.kind === "QUOTATION" ? "Quotation" : "Invoice"}`} subtitle={`Update ${document.reference} before finalizing or sharing.`}>
      {query?.error && errors[query.error] ? <p className="admin-feedback error" role="alert">{errors[query.error]}</p> : null}
      <section className="document-editor-panel">
        <WalkInSaleForm
          action={updateDraftDocumentAction.bind(null, document.id)}
          initialCustomer={{
            name: document.customerName,
            email: document.customerEmail,
            phone: document.customerPhone,
            paymentMethod: document.paymentMethod
          }}
          initialLines={document.items.map((item) => ({ productId: item.productId ?? "", quantity: item.quantity })).filter((item) => item.productId)}
          products={products}
          submitLabel={`Save ${document.kind === "QUOTATION" ? "quotation" : "invoice"}`}
        />
      </section>
    </AdminLayout>
  );
}

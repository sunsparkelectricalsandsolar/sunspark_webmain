import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WalkInSaleForm } from "@/components/admin/walk-in-sale-form";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { createDraftInvoiceAction, finalizeDraftInvoiceAction } from "./actions";

export const dynamic = "force-dynamic";

const feedback: Record<string, string> = { created: "Draft invoice created. Stock has not changed.", details: "Enter the customer and at least one item.", items: "One or more selected products are unavailable.", stock: "Stock changed before finalization. Review the invoice and try again.", finalize: "This invoice is already finalized or unavailable." };

export default async function InvoicesPage({ searchParams }: { searchParams?: Promise<{ q?: string; error?: string; notice?: string }> }) {
  await requireAdmin("/admin/invoices");
  const params = await searchParams;
  const [products, invoices] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, priceCents: true, stockQuantity: true }, orderBy: { name: "asc" }, take: 500 }),
    getInvoices(params?.q)
  ]);
  const message = params?.error ? feedback[params.error] : params?.notice ? feedback[params.notice] : null;
  return <AdminLayout title="Invoices" subtitle="Create enquiry invoices without changing stock. Finalize only when the sale is confirmed.">
    {message ? <p className={`admin-feedback ${params?.error ? "error" : "success"}`} role="status">{message}</p> : null}
    <details className="admin-disclosure"><summary>Create invoice draft</summary><WalkInSaleForm action={createDraftInvoiceAction} products={products} submitLabel="Create invoice draft" /></details>
    <form action="/admin/invoices" className="admin-filter"><input defaultValue={params?.q ?? ""} name="q" placeholder="Search invoice, customer, email, phone, item..." /><button type="submit">Search</button></form>
    <div className="admin-table"><div className="admin-table-row invoice-row heading"><span>Reference</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span /></div>
      {invoices.map((invoice) => <div className="admin-table-row invoice-row" key={invoice.id}><strong>{invoice.reference}<small>{invoice.createdAt.toLocaleDateString("en-KE")}</small></strong><span>{invoice.customerName}<small>{invoice.customerPhone ?? invoice.customerEmail ?? "No contact"}</small></span><span>{invoice.items.length}</span><strong>{formatMoney(invoice.totalCents)}</strong><span>{invoice.status}</span>{invoice.status === "DRAFT" ? <form action={finalizeDraftInvoiceAction.bind(null, invoice.id)}><button className="primary-btn" type="submit">Finalize</button></form> : invoice.orderId ? <Link className="table-link" href={`/admin/walk-in-sale/${invoice.orderId}/receipt`}>Receipt</Link> : null}</div>)}
      {!invoices.length ? <p className="empty-state">No invoice drafts match this search.</p> : null}
    </div>
  </AdminLayout>;
}

async function getInvoices(q?: string) {
  const terms = q?.trim().split(/\s+/).filter(Boolean) ?? [];
  return prisma.draftInvoice.findMany({ where: terms.length ? { AND: terms.map((term) => ({ OR: [{ reference: { contains: term } }, { customerName: { contains: term } }, { customerEmail: { contains: term } }, { customerPhone: { contains: term } }, { items: { some: { OR: [{ productName: { contains: term } }, { sku: { contains: term } }] } } }] })) } : {}, include: { items: true }, orderBy: { updatedAt: "desc" }, take: 100 });
}

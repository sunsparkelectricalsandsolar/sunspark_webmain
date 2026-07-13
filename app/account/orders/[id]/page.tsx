import { notFound } from "next/navigation";
import { SalesDocument } from "@/components/admin/sales-document";
import { getOrderInvoice } from "@/lib/invoices/invoice-service";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderInvoice(id);

  if (!order) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container invoice-page">
        <div className="section-title">
          <h3>Invoice {order.invoice?.invoiceNumber}</h3>
        </div>
        <SalesDocument
          customerEmail={order.customerEmail}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          date={order.createdAt}
          items={order.items}
          kind="INVOICE"
          number={order.invoice?.invoiceNumber ?? order.orderNumber}
          paymentLabel={order.paymentMethod}
          statusLabel={order.paymentStatus}
          subtotalCents={order.subtotalCents}
          totalCents={order.totalCents}
        />
      </div>
    </section>
  );
}

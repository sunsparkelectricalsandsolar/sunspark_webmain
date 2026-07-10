import { notFound } from "next/navigation";
import { getOrderInvoice } from "@/lib/invoices/invoice-service";
import { formatMoney } from "@/lib/money";

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
          <button className="secondary-btn" type="button" onClick={undefined}>
            Print
          </button>
        </div>
        <div className="invoice-box">
          <p>{order.orderNumber}</p>
          <h1>{order.customerName}</h1>
          <p>{order.customerEmail}</p>
          {order.items.map((item) => (
            <div className="summary-line" key={item.id}>
              <span>
                {item.productName} x{item.quantity}
              </span>
              <strong>{formatMoney(item.totalCents)}</strong>
            </div>
          ))}
          <div className="summary-line total">
            <span>Total</span>
            <strong>{formatMoney(order.totalCents)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

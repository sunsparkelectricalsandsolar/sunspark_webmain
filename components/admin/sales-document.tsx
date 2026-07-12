import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { formatMoney } from "@/lib/money";

export type SalesDocumentKind = "INVOICE" | "RECEIPT" | "QUOTATION";

type SalesDocumentItem = {
  id?: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitCents: number;
  totalCents: number;
};

type SalesDocumentProps = {
  kind: SalesDocumentKind;
  number?: string | null;
  date: Date | string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  paymentLabel?: string;
  statusLabel?: string;
  items: SalesDocumentItem[];
  subtotalCents: number;
  totalCents: number;
  note?: string | null;
};

export function SalesDocument({
  customerEmail,
  customerName,
  customerPhone,
  date,
  items,
  kind,
  note,
  number,
  paymentLabel,
  statusLabel,
  subtotalCents,
  totalCents
}: SalesDocumentProps) {
  const documentDate = date instanceof Date ? date : new Date(date);

  return (
    <article className="sales-document" id="admin-print-document">
      <header className="sales-document-header">
        <div className="sales-document-brand">
          <Image alt={siteConfig.name} height={72} priority src="/logo.jpg" width={150} />
          <div>
            <h2>{siteConfig.name}</h2>
            <p>{siteConfig.location}</p>
            <p>{siteConfig.phone} | {siteConfig.email}</p>
            <p>{siteConfig.url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
        <div className="sales-document-title">
          <span>{kind}</span>
          <strong>{number ?? "Pending"}</strong>
          <small>{documentDate.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</small>
        </div>
      </header>

      <section className="sales-document-summary">
        <div>
          <span>Bill to</span>
          <strong>{customerName}</strong>
          {customerPhone ? <p>{customerPhone}</p> : null}
          {customerEmail ? <p>{customerEmail}</p> : null}
        </div>
        <div>
          <span>Document details</span>
          {paymentLabel ? <p><strong>Payment:</strong> {paymentLabel}</p> : null}
          {statusLabel ? <p><strong>Status:</strong> {statusLabel}</p> : null}
          {kind === "QUOTATION" ? <p><strong>Validity:</strong> Subject to stock availability</p> : null}
        </div>
      </section>

      <div className="sales-document-table" role="table" aria-label={`${kind.toLowerCase()} items`}>
        <div className="sales-document-row sales-document-row-head" role="row">
          <span>No.</span>
          <span>Item description</span>
          <span>Qty</span>
          <span>Unit price</span>
          <span>Amount</span>
        </div>
        {items.map((item, index) => (
          <div className="sales-document-row" key={item.id ?? `${item.productName}-${index}`} role="row">
            <span>{index + 1}</span>
            <span><strong>{item.productName}</strong>{item.sku ? <small>SKU: {item.sku}</small> : null}</span>
            <span>{item.quantity}</span>
            <span>{formatMoney(item.unitCents)}</span>
            <strong>{formatMoney(item.totalCents)}</strong>
          </div>
        ))}
      </div>

      <section className="sales-document-bottom">
        <div className="sales-document-note">
          <strong>Notes</strong>
          <p>{note ?? "Thank you for choosing Sunspark Electrical and Solar."}</p>
        </div>
        <div className="sales-document-totals">
          <p><span>Subtotal</span><strong>{formatMoney(subtotalCents)}</strong></p>
          <p className="grand-total"><span>Total</span><strong>{formatMoney(totalCents)}</strong></p>
        </div>
      </section>
    </article>
  );
}

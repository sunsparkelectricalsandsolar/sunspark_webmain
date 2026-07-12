"use client";

import { useEffect, useMemo, useState } from "react";
import { PendingButton } from "@/components/ui/pending-button";

type SaleProduct = {
  id: string;
  name: string;
  sku: string | null;
  priceCents: number;
  stockQuantity: number;
};

type SaleLine = { productId: string; quantity: number };

function money(cents: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(cents / 100);
}

export function WalkInSaleForm({
  action,
  products,
  submitLabel = "Complete sale"
}: {
  action: (formData: FormData) => Promise<void>;
  products: SaleProduct[];
  submitLabel?: string;
}) {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [productQuery, setProductQuery] = useState("");
  const [formError, setFormError] = useState("");
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const matchingProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query));
  }, [productQuery, products]);
  const total = lines.reduce((sum, line) => sum + (productById.get(line.productId)?.priceCents ?? 0) * line.quantity, 0);

  useEffect(() => {
    if (!matchingProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(matchingProducts[0]?.id ?? "");
    }
  }, [matchingProducts, selectedProductId]);

  function addLine() {
    const product = productById.get(selectedProductId);
    if (!product) return;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => line.productId === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.stockQuantity) } : line);
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }

  return (
    <form action={action} className="walk-in-sale-form" onSubmit={(event) => {
      if (!lines.length) {
        event.preventDefault();
        setFormError("Add at least one product before completing the sale.");
      }
    }}>
      <section className="sale-panel">
        <div className="sale-panel-heading"><h2>Customer</h2><p>Capture the details needed for the receipt.</p></div>
        <div className="form-grid two">
          <label>Customer name<input name="customerName" placeholder="Walk-in customer" required /></label>
          <label>Phone number<input name="customerPhone" inputMode="tel" placeholder="Optional" /></label>
        </div>
        <label>Email address<input name="customerEmail" placeholder="Optional - useful for emailed invoices" type="email" /></label>
        <label>Payment method
          <select defaultValue="CASH" name="paymentMethod"><option value="CASH">Cash</option><option value="MPESA">M-Pesa</option></select>
        </label>
      </section>
      <section className="sale-panel">
        <div className="sale-panel-heading"><h2>Products</h2><p>Only products with stock are shown.</p></div>
        <div className="sale-product-picker">
          <label className="sale-search-field">
            <span>Find product</span>
            <input aria-label="Search walk-in products" onChange={(event) => setProductQuery(event.target.value)} placeholder="Search by product name or SKU" type="search" value={productQuery} />
          </label>
          <label className="sale-select-field">
            <span>Select product</span>
            <select aria-label="Select product" onChange={(event) => setSelectedProductId(event.target.value)} value={selectedProductId}>
              {matchingProducts.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.stockQuantity} available)</option>)}
              {!matchingProducts.length ? <option value="">No matching products</option> : null}
            </select>
          </label>
          <button className="secondary-btn" onClick={addLine} type="button">Add item</button>
        </div>
        <div className="sale-lines" aria-live="polite">
          {lines.map((line) => {
            const product = productById.get(line.productId);
            if (!product) return null;
            return <div className="sale-line" key={product.id}>
              <input name="productId" type="hidden" value={product.id} />
              <span><strong>{product.name}</strong><small>{product.sku} · {money(product.priceCents)} each</small></span>
              <input aria-label={`${product.name} quantity`} max={product.stockQuantity} min="1" name="quantity" onChange={(event) => setLines((current) => current.map((item) => item.productId === product.id ? { ...item, quantity: Math.max(1, Math.min(product.stockQuantity, Number(event.target.value) || 1)) } : item))} type="number" value={line.quantity} />
              <strong>{money(product.priceCents * line.quantity)}</strong>
              <button aria-label={`Remove ${product.name}`} className="remove-line" onClick={() => setLines((current) => current.filter((item) => item.productId !== product.id))} type="button">Remove</button>
            </div>;
          })}
          {!lines.length ? <p className="empty-state">No products added to this sale.</p> : null}
        </div>
      </section>
      {formError ? <p className="admin-feedback error" role="alert">{formError}</p> : null}
      <div className="sale-total"><span>Total</span><strong>{money(total)}</strong><PendingButton disabled={!lines.length} pendingText={`${submitLabel.replace(/^Create /, "Creating ").replace(/^Complete /, "Completing ")}...`}>{submitLabel}</PendingButton></div>
    </form>
  );
}

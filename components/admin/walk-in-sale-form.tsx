"use client";

import { useEffect, useMemo, useState } from "react";
import { PendingButton } from "@/components/ui/pending-button";
import type { ProductOption } from "@/lib/types";

type SaleProduct = {
  id: string;
  name: string;
  priceCents: number;
  stockQuantity: number;
  options: ProductOption[];
};

type SaleLine = { productId: string; productOptionId?: string | null; quantity: number };

function money(cents: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(cents / 100);
}

export function WalkInSaleForm({
  action,
  initialCustomer,
  initialLines = [],
  products,
  submitLabel = "Complete sale"
}: {
  action: (formData: FormData) => Promise<void>;
  initialCustomer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    paymentMethod?: "CASH" | "MPESA" | "WHATSAPP" | string | null;
  };
  initialLines?: SaleLine[];
  products: SaleProduct[];
  submitLabel?: string;
}) {
  const [lines, setLines] = useState<SaleLine[]>(initialLines);
  const choices = useMemo(() => products.flatMap((product) => {
    const options = product.options?.length ? product.options : [{
      id: "",
      productId: product.id,
      label: "Unit",
      sellingUnit: "UNIT" as const,
      priceCents: product.priceCents,
      compareAtCents: null,
      costCents: 0,
      stockMultiplier: 1,
      isDefault: true,
      sortOrder: 0,
      createdAt: "",
      updatedAt: ""
    }];
    return options.map((option) => ({ product, option, key: `${product.id}::${option.id}` }));
  }), [products]);
  const [selectedKey, setSelectedKey] = useState(choices[0]?.key ?? "");
  const [productQuery, setProductQuery] = useState("");
  const [formError, setFormError] = useState("");
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const choiceByKey = useMemo(() => new Map(choices.map((choice) => [choice.key, choice])), [choices]);
  const matchingChoices = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return choices;
    return choices.filter(({ product, option }) => `${product.name} ${option.label}`.toLowerCase().includes(query));
  }, [choices, productQuery]);
  const total = lines.reduce((sum, line) => {
    const product = productById.get(line.productId);
    const option = product?.options?.find((item) => item.id === line.productOptionId) ?? product?.options?.find((item) => item.isDefault);
    return sum + (option?.priceCents ?? product?.priceCents ?? 0) * line.quantity;
  }, 0);

  useEffect(() => {
    if (!matchingChoices.some((choice) => choice.key === selectedKey)) {
      setSelectedKey(matchingChoices[0]?.key ?? "");
    }
  }, [matchingChoices, selectedKey]);

  function addLine() {
    const choice = choiceByKey.get(selectedKey);
    if (!choice) return;
    const { product, option } = choice;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id && (line.productOptionId ?? "") === option.id);
      if (existing) {
        return current.map((line) => line.productId === product.id && (line.productOptionId ?? "") === option.id ? { ...line, quantity: Math.min(line.quantity + 1, product.stockQuantity) } : line);
      }
      return [...current, { productId: product.id, productOptionId: option.id || null, quantity: 1 }];
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
          <label>Customer name<input defaultValue={initialCustomer?.name ?? ""} name="customerName" placeholder="Walk-in customer" required /></label>
          <label>Phone number<input defaultValue={initialCustomer?.phone ?? ""} name="customerPhone" inputMode="tel" placeholder="Optional" /></label>
        </div>
        <label>Email address<input defaultValue={initialCustomer?.email ?? ""} name="customerEmail" placeholder="Optional - useful for emailed invoices" type="email" /></label>
        <label>Payment method
          <select defaultValue={initialCustomer?.paymentMethod ?? "CASH"} name="paymentMethod"><option value="CASH">Cash</option><option value="MPESA">M-Pesa</option><option value="WHATSAPP">WhatsApp</option></select>
        </label>
      </section>
      <section className="sale-panel">
        <div className="sale-panel-heading"><h2>Products</h2><p>Only products with stock are shown.</p></div>
        <div className="sale-product-picker">
          <label className="sale-search-field">
            <span>Find product</span>
            <input aria-label="Search walk-in products" onChange={(event) => setProductQuery(event.target.value)} placeholder="Search by product name" type="search" value={productQuery} />
          </label>
          <label className="sale-select-field">
            <span>Select product</span>
            <select aria-label="Select product" onChange={(event) => setSelectedKey(event.target.value)} value={selectedKey}>
              {matchingChoices.map(({ product, option, key }) => <option key={key} value={key}>{product.name} - {option.label} ({product.stockQuantity} available)</option>)}
              {!matchingChoices.length ? <option value="">No matching products</option> : null}
            </select>
          </label>
          <button className="secondary-btn" onClick={addLine} type="button">Add item</button>
        </div>
        <div className="sale-lines" aria-live="polite">
          {lines.map((line) => {
            const product = productById.get(line.productId);
            if (!product) return null;
            const option = product.options?.find((item) => item.id === line.productOptionId) ?? product.options?.find((item) => item.isDefault);
            const lineKey = `${product.id}-${option?.id ?? "default"}`;
            const unitPrice = option?.priceCents ?? product.priceCents;
            return <div className="sale-line" key={lineKey}>
              <input name="productId" type="hidden" value={product.id} />
              <input name="productOptionId" type="hidden" value={option?.id ?? ""} />
              <span><strong>{product.name}</strong><small>{option?.label ? `${option.label} · ` : ""}{money(unitPrice)} each</small></span>
              <input aria-label={`${product.name} quantity`} max={product.stockQuantity} min="1" name="quantity" onChange={(event) => setLines((current) => current.map((item) => item.productId === product.id && (item.productOptionId ?? "") === (option?.id ?? "") ? { ...item, quantity: Math.max(1, Math.min(product.stockQuantity, Number(event.target.value) || 1)) } : item))} type="number" value={line.quantity} />
              <strong>{money(unitPrice * line.quantity)}</strong>
              <button aria-label={`Remove ${product.name}`} className="remove-line" onClick={() => setLines((current) => current.filter((item) => !(item.productId === product.id && (item.productOptionId ?? "") === (option?.id ?? ""))))} type="button">Remove</button>
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

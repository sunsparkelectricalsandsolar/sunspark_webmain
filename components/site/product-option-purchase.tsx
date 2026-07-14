"use client";

import { useMemo, useState } from "react";
import { PendingButton } from "@/components/ui/pending-button";
import { formatMoney } from "@/lib/money";
import { sellingUnitLabel } from "@/lib/products/units";
import type { ProductOption, SellingUnit } from "@/lib/types";

type ProductOptionPurchaseProps = {
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  options: ProductOption[];
};

function fallbackLabel(unit: SellingUnit) {
  return sellingUnitLabel(unit).replace(/^./, (letter) => letter.toUpperCase());
}

export function ProductOptionPurchase({ action, disabled = false, options }: ProductOptionPurchaseProps) {
  const defaultOption = useMemo(() => options.find((option) => option.isDefault) ?? options[0], [options]);
  const [selectedId, setSelectedId] = useState(defaultOption?.id ?? "");
  const selected = options.find((option) => option.id === selectedId) ?? defaultOption;

  if (!selected) {
    return null;
  }

  return (
    <form action={action} className="product-option-purchase">
      <label>
        Buy as
        <select name="optionId" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
          {options.map((option) => (
            <option key={option.id || `${option.sellingUnit}-${option.priceCents}`} value={option.id}>
              {option.label || fallbackLabel(option.sellingUnit)}
            </option>
          ))}
        </select>
      </label>
      <div className="detail-price option-price">
        <strong>{formatMoney(selected.priceCents)} / {sellingUnitLabel(selected.sellingUnit)}</strong>
        {selected.compareAtCents ? <span>{formatMoney(selected.compareAtCents)}</span> : null}
      </div>
      <PendingButton disabled={disabled} pendingText="Adding...">Add to cart</PendingButton>
    </form>
  );
}

"use server";

import type { DraftInvoiceKind } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";

function requestedItems(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map((value) => Number(value));
  if (!productIds.length || productIds.length !== quantities.length) return null;
  const requested = new Map<string, number>();
  for (let index = 0; index < productIds.length; index += 1) {
    const quantity = quantities[index];
    if (!productIds[index] || !Number.isInteger(quantity) || quantity < 1) return null;
    requested.set(productIds[index], (requested.get(productIds[index]) ?? 0) + quantity);
  }
  return requested;
}

async function createSalesDocument(formData: FormData, kind: DraftInvoiceKind) {
  await requireAdmin("/admin/invoices");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const requested = requestedItems(formData);
  if (customerName.length < 2 || !requested) redirect(`/admin/invoices?error=details&tab=${kind.toLowerCase()}`);
  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices?notice=${kind === "QUOTATION" ? "quotation" : "created"}`);
}

export async function createDraftInvoiceAction(formData: FormData) {
  await createSalesDocument(formData, "INVOICE");
}

export async function createQuotationAction(formData: FormData) {
  await createSalesDocument(formData, "QUOTATION");
}

export async function finalizeDraftInvoiceAction(draftId: string) {
  await requireAdmin("/admin/invoices");
  void draftId;
  redirect("/admin/invoices?error=finalize");
}

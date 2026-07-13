"use server";

import type { DraftInvoiceKind } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";
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
  const customerEmail = String(formData.get("customerEmail") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  const requested = requestedItems(formData);
  if (customerName.length < 2 || !requested) redirect(`/admin/invoices?error=details&tab=${kind.toLowerCase()}`);
  await apiFetch("/admin/draft-documents", {
    method: "POST",
    body: JSON.stringify({
      kind,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      items: [...requested.entries()].map(([productId, quantity]) => ({ productId, quantity }))
    })
  }).catch((error: unknown) => {
    if (error instanceof ApiError) redirect(`/admin/invoices?error=items&tab=${kind.toLowerCase()}`);
    throw error;
  });
  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices?notice=${kind === "QUOTATION" ? "quotation" : "created"}`);
}

async function salesDocumentPayload(formData: FormData) {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  const requested = requestedItems(formData);
  if (customerName.length < 2 || !requested) return null;
  return {
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
    items: [...requested.entries()].map(([productId, quantity]) => ({ productId, quantity }))
  };
}

export async function createDraftInvoiceAction(formData: FormData) {
  await createSalesDocument(formData, "INVOICE");
}

export async function createQuotationAction(formData: FormData) {
  await createSalesDocument(formData, "QUOTATION");
}

export async function updateDraftDocumentAction(draftId: string, formData: FormData) {
  await requireAdmin(`/admin/invoices/${draftId}/edit`);
  const payload = await salesDocumentPayload(formData);
  if (!payload) redirect(`/admin/invoices/${draftId}/edit?error=details`);

  await apiFetch(`/admin/draft-documents/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }).catch((error: unknown) => {
    if (error instanceof ApiError) redirect(`/admin/invoices/${draftId}/edit?error=items`);
    throw error;
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${draftId}`);
  redirect(`/admin/invoices/${draftId}?notice=updated`);
}

export async function finalizeDraftInvoiceAction(draftId: string) {
  await requireAdmin("/admin/invoices");
  const order = await apiFetch<{ id: string }>(`/admin/draft-documents/${draftId}/finalize`, { method: "POST" }).catch((error: unknown) => {
    if (error instanceof ApiError) redirect("/admin/invoices?error=stock");
    throw error;
  });
  revalidatePath("/"); revalidatePath("/store"); revalidatePath("/admin/invoices"); revalidatePath("/admin/orders"); revalidatePath("/admin/products");
  redirect(`/admin/walk-in-sale/${order.id}/receipt`);
}

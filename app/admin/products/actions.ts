"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { requireAdmin } from "@/lib/auth/guards";
import { saveProductImages } from "@/lib/uploads/product-images";
import { productInputSchema, slugifyProductName } from "@/lib/products/validation";

function amountToCents(value: FormDataEntryValue | null) {
  const numeric = Number(String(value ?? "0"));
  return Math.round((Number.isFinite(numeric) ? numeric : 0) * 100);
}

function parseProductForm(formData: FormData) {
  return productInputSchema.parse({
    name: formData.get("name"),
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    brand: String(formData.get("brand") ?? "").trim() || undefined,
    categoryId: formData.get("categoryId"),
    shortDescription: String(formData.get("shortDescription") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    priceCents: amountToCents(formData.get("priceKsh")),
    compareAtCents: formData.get("compareAtKsh") ? amountToCents(formData.get("compareAtKsh")) : undefined,
    costCents: formData.get("costKsh") ? amountToCents(formData.get("costKsh")) : 0,
    sellingUnit: formData.get("sellingUnit"),
    stockQuantity: formData.get("stockQuantity"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isHotDeal: formData.get("isHotDeal") === "on",
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || undefined,
    seoDescription: String(formData.get("seoDescription") ?? "").trim() || undefined,
    seoKeywords: String(formData.get("seoKeywords") ?? "").trim() || undefined
  });
}

function getImageFiles(formData: FormData) {
  return formData.getAll("images").filter((value): value is File => value instanceof File);
}

function getDeleteImageIds(formData: FormData) {
  return formData.getAll("deleteImageIds").map(String).filter(Boolean);
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const input = parseProductForm(formData);
  const images = await saveProductImages(getImageFiles(formData), input.name);
  const slug = slugifyProductName(input.name);

  await apiFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      slug,
      images: images.map((image, index) => ({ ...image, isPrimary: index === 0, sortOrder: index }))
    })
  });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products");
}

export async function updateProductAction(productId: string, formData: FormData) {
  await requireAdmin();

  const input = parseProductForm(formData);
  const images = await saveProductImages(getImageFiles(formData), input.name);
  const primaryImageId = String(formData.get("primaryImageId") ?? "");
  const deleteImageIds = getDeleteImageIds(formData);
  await apiFetch(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...input,
      slug: slugifyProductName(input.name),
      images,
      deleteImageIds,
      primaryImageId: primaryImageId || null
    })
  });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();

  await apiFetch(`/admin/products/${productId}/hide`, { method: "PATCH" });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products");
}

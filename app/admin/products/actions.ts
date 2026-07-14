"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";
import { requireAdmin } from "@/lib/auth/guards";
import { getImageUploadError, saveProductImages } from "@/lib/uploads/product-images";
import { productInputSchema, slugifyProductName } from "@/lib/products/validation";

function amountToCents(value: FormDataEntryValue | null) {
  const numeric = Number(String(value ?? "0"));
  return Math.round((Number.isFinite(numeric) ? numeric : 0) * 100);
}

function parseProductForm(formData: FormData) {
  return productInputSchema.parse({
    name: formData.get("name"),
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

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message.slice(0, 180);
  }

  if (error instanceof Error) {
    return error.message.slice(0, 180);
  }

  return "The request could not be completed.";
}

function productErrorPath(path: string, code: string, message?: string) {
  const params = new URLSearchParams({ error: code });
  if (message) params.set("message", message);
  return `${path}?${params.toString()}`;
}

function isRedirectError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  try {
    const input = parseProductForm(formData);
    const files = getImageFiles(formData);
    const imageError = getImageUploadError(files);
    if (imageError) redirect(productErrorPath("/admin/products/new", "image", imageError));

    const images = await saveProductImages(files, input.name);
    const slug = slugifyProductName(input.name);

    await apiFetch("/admin/products", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        slug,
        images: images.map((image, index) => ({ ...image, isPrimary: index === 0, sortOrder: index }))
      })
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const status = error instanceof ApiError ? error.status : 0;
    const message = errorMessage(error);
    console.error("Product create failed", { status, message });
    redirect(productErrorPath("/admin/products/new", status === 409 ? "duplicate" : "save", message));
  }

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products");
}

export async function updateProductAction(productId: string, formData: FormData) {
  await requireAdmin();

  try {
    const input = parseProductForm(formData);
    const files = getImageFiles(formData);
    const imageError = getImageUploadError(files);
    if (imageError) redirect(productErrorPath(`/admin/products/${productId}/edit`, "image", imageError));

    const images = await saveProductImages(files, input.name);
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
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const status = error instanceof ApiError ? error.status : 0;
    const message = errorMessage(error);
    console.error("Product update failed", { status, message });
    redirect(productErrorPath(`/admin/products/${productId}/edit`, status === 409 ? "duplicate" : "save", message));
  }

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();

  try {
    await apiFetch(`/admin/products/${productId}`, { method: "DELETE" });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect(`/admin/products?error=${error.status === 409 ? "delete-linked" : "delete"}`);
  }

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products?notice=deleted");
}

export async function hideProductAction(productId: string) {
  await requireAdmin();

  await apiFetch(`/admin/products/${productId}/hide`, { method: "PATCH" });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/products?notice=hidden");
}

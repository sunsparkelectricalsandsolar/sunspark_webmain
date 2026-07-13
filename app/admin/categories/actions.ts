"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch, ApiError } from "@/lib/api/client";
import { slugifyProductName } from "@/lib/products/validation";
import { saveCategoryImages } from "@/lib/uploads/product-images";
import { getImageUploadError } from "@/lib/uploads/product-images";

function getImageFiles(formData: FormData) {
  return formData.getAll("images").filter((value): value is File => value instanceof File);
}

function getDeleteImageIds(formData: FormData) {
  return formData.getAll("deleteImageIds").map(String).filter(Boolean);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const files = getImageFiles(formData);

  if (name.length < 2) {
    redirect("/admin/categories?error=invalid");
  }

  if (getImageUploadError(files)) redirect("/admin/categories?error=image");

  const slug = slugifyProductName(name);
  const images = await saveCategoryImages(files, name);

  try {
    await apiFetch("/admin/categories", {
      method: "POST",
      body: JSON.stringify({
      name,
      slug,
      description: description || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: formData.get("isActive") === "on",
      images: images.map((image, index) => ({ ...image, isPrimary: index === 0, sortOrder: index }))
      })
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect("/admin/categories?error=duplicate");
  }

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/categories?notice=saved");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const files = getImageFiles(formData);
  const primaryImageId = String(formData.get("primaryImageId") ?? "");
  const deleteImageIds = getDeleteImageIds(formData);

  if (name.length < 2) {
    redirect(`/admin/categories/${categoryId}/edit?error=invalid`);
  }

  if (getImageUploadError(files)) redirect(`/admin/categories/${categoryId}/edit?error=image`);

  const slug = slugifyProductName(name);
  const images = await saveCategoryImages(files, name);

  try {
    await apiFetch(`/admin/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        slug,
        description: description || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: formData.get("isActive") === "on",
        images,
        deleteImageIds,
        primaryImageId: primaryImageId || null
      })
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect(`/admin/categories/${categoryId}/edit?error=duplicate`);
  }

  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath(`/category/${slug}`);
  redirect("/admin/categories");
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();

  await apiFetch(`/admin/categories/${categoryId}/hide`, { method: "PATCH" });

  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?notice=hidden");
}

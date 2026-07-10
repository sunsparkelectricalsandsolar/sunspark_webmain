"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugifyProductName } from "@/lib/products/validation";
import { saveCategoryImages } from "@/lib/uploads/product-images";

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
  const images = await saveCategoryImages(getImageFiles(formData), name);

  if (name.length < 2) {
    redirect("/admin/categories?error=invalid");
  }

  await prisma.category.create({
    data: {
      name,
      slug: slugifyProductName(name),
      description: description || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: formData.get("isActive") === "on",
      images: {
        create: images.map((image, index) => ({
          ...image,
          isPrimary: index === 0,
          sortOrder: index
        }))
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/categories");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const images = await saveCategoryImages(getImageFiles(formData), name);
  const primaryImageId = String(formData.get("primaryImageId") ?? "");
  const deleteImageIds = getDeleteImageIds(formData);
  const existingImages = await prisma.categoryImage.count({ where: { categoryId } });

  if (name.length < 2) {
    redirect("/admin/categories?error=invalid");
  }

  await prisma.$transaction([
    prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug: slugifyProductName(name),
        description: description || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive: formData.get("isActive") === "on",
        images: {
          create: images.map((image, index) => ({
            ...image,
            isPrimary: existingImages === 0 && index === 0,
            sortOrder: existingImages + index
          }))
        }
      }
    }),
    ...(deleteImageIds.length
      ? [prisma.categoryImage.deleteMany({ where: { categoryId, id: { in: deleteImageIds } } })]
      : []),
    ...(primaryImageId
      ? [
          prisma.categoryImage.updateMany({ where: { categoryId }, data: { isPrimary: false } }),
          prisma.categoryImage.update({ where: { id: primaryImageId }, data: { isPrimary: true } })
        ]
      : [])
  ]);

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/categories");
}

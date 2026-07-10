"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugifyProductName } from "@/lib/products/validation";

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (name.length < 2) {
    redirect("/admin/categories?error=invalid");
  }

  await prisma.category.create({
    data: {
      name,
      slug: slugifyProductName(name),
      description: description || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: formData.get("isActive") === "on"
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

  if (name.length < 2) {
    redirect("/admin/categories?error=invalid");
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug: slugifyProductName(name),
      description: description || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidatePath("/");
  revalidatePath("/store");
  redirect("/admin/categories");
}

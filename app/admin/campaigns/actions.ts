"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugifyProductName } from "@/lib/products/validation";
import { saveUploadedImages } from "@/lib/uploads/product-images";

function imageFiles(formData: FormData) {
  return formData.getAll("images").filter((value): value is File => value instanceof File);
}

export async function createCampaignAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const images = await saveUploadedImages(imageFiles(formData), title, "categories");

  if (title.length < 2) {
    redirect("/admin/campaigns?error=invalid");
  }

  await prisma.campaign.create({
    data: {
      title,
      slug: slugifyProductName(title),
      description: description || null,
      imageUrl: images[0]?.url ?? null,
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidatePath("/");
  redirect("/admin/campaigns");
}

export async function updateCampaignAction(campaignId: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const images = await saveUploadedImages(imageFiles(formData), title, "categories");

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      title,
      slug: slugifyProductName(title),
      description: description || null,
      ...(images[0] ? { imageUrl: images[0].url } : {}),
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidatePath("/");
  redirect("/admin/campaigns");
}

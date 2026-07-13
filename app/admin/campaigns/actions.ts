"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
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

  await apiFetch("/admin/campaigns", {
    method: "POST",
    body: JSON.stringify({
      title,
      description: description || null,
      imageUrl: images[0]?.url ?? null,
      badge: String(formData.get("badge") ?? "").trim() || null,
      offerLabel: String(formData.get("offerLabel") ?? "").trim() || null,
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
      ctaUrl: String(formData.get("ctaUrl") ?? "").trim() || null,
      endsAt: String(formData.get("endsAt") ?? "").trim() || null,
      isActive: formData.get("isActive") === "on"
    })
  });

  revalidatePath("/");
  redirect("/admin/campaigns");
}

export async function updateCampaignAction(campaignId: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const images = await saveUploadedImages(imageFiles(formData), title, "categories");

  await apiFetch(`/admin/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title,
      description: description || null,
      imageUrl: images[0]?.url ?? null,
      badge: String(formData.get("badge") ?? "").trim() || null,
      offerLabel: String(formData.get("offerLabel") ?? "").trim() || null,
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
      ctaUrl: String(formData.get("ctaUrl") ?? "").trim() || null,
      endsAt: String(formData.get("endsAt") ?? "").trim() || null,
      isActive: formData.get("isActive") === "on"
    })
  });

  revalidatePath("/");
  redirect("/admin/campaigns");
}

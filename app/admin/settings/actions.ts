"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      facebookUrl: String(formData.get("facebookUrl") ?? "") || null,
      mapUrl: String(formData.get("mapUrl") ?? "") || null,
      location: String(formData.get("location") ?? "") || null
    },
    create: {
      id: "default",
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      facebookUrl: String(formData.get("facebookUrl") ?? "") || null,
      mapUrl: String(formData.get("mapUrl") ?? "") || null,
      location: String(formData.get("location") ?? "") || null
    }
  });

  await prisma.checkoutSettings.upsert({
    where: { id: "default" },
    update: {
      whatsappEnabled: formData.get("whatsappEnabled") === "on",
      mpesaEnabled: formData.get("mpesaEnabled") === "on",
      whatsappPhone: String(formData.get("whatsappPhone") ?? "")
    },
    create: {
      id: "default",
      whatsappEnabled: formData.get("whatsappEnabled") === "on",
      mpesaEnabled: formData.get("mpesaEnabled") === "on",
      whatsappPhone: String(formData.get("whatsappPhone") ?? "")
    }
  });

  revalidatePath("/");
  redirect("/admin/settings");
}

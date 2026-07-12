"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import { siteConfig } from "@/lib/site-config";

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();

  await apiFetch("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({
      storeName: String(formData.get("name") ?? "Sunspark Electricals & Solar"),
      supportEmail: String(formData.get("email") ?? siteConfig.email),
      reportEmail: siteConfig.reportEmail,
      whatsappPhone: String(formData.get("whatsappPhone") ?? siteConfig.whatsappPhone),
      currency: "KSH"
    })
  });

  revalidatePath("/");
  redirect("/admin/settings");
}

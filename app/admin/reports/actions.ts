"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";
import { requireAdmin } from "@/lib/auth/guards";

export async function emailDailyReportAction(formData: FormData) {
  await requireAdmin("/admin/reports");
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/admin/reports?error=date");

  try {
    await apiFetch("/admin/reports/daily-email", {
      method: "POST",
      body: JSON.stringify({ date })
    });
  } catch (error) {
    if (error instanceof ApiError) redirect(`/admin/reports?date=${date}&error=email&message=${encodeURIComponent(error.message)}`);
    throw error;
  }

  redirect(`/admin/reports?date=${date}&notice=emailed`);
}

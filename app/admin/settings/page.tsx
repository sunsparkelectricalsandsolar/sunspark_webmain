import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <AdminLayout title="Settings" subtitle="Business identity, contact links, checkout methods, and payment availability.">
      <form action={updateSettingsAction} className="admin-form">
        <div className="form-grid two">
          <label>
            Business name
            <input name="name" defaultValue={settings.site?.name ?? siteConfig.name} />
          </label>
          <label>
            Email
            <input name="email" defaultValue={settings.site?.email ?? siteConfig.email} />
          </label>
        </div>
        <div className="form-grid two">
          <label>
            Phone
            <input name="phone" defaultValue={settings.site?.phone ?? siteConfig.phone} />
          </label>
          <label>
            WhatsApp phone
            <input name="whatsappPhone" defaultValue={settings.checkout?.whatsappPhone ?? siteConfig.whatsappPhone} />
          </label>
        </div>
        <label>
          Location
          <input name="location" defaultValue={settings.site?.location ?? siteConfig.location} />
        </label>
        <label>
          Facebook URL
          <input name="facebookUrl" defaultValue={settings.site?.facebookUrl ?? siteConfig.facebookUrl} />
        </label>
        <label>
          Map URL
          <input name="mapUrl" defaultValue={settings.site?.mapUrl ?? siteConfig.mapUrl} />
        </label>
        <div className="form-grid two">
          <label className="check-label">
            <input name="whatsappEnabled" type="checkbox" defaultChecked={settings.checkout?.whatsappEnabled ?? true} />
            WhatsApp checkout enabled
          </label>
          <label className="check-label">
            <input name="mpesaEnabled" type="checkbox" defaultChecked={settings.checkout?.mpesaEnabled ?? false} />
            M-Pesa checkout enabled
          </label>
        </div>
        <button className="primary-btn" type="submit">Save settings</button>
      </form>
    </AdminLayout>
  );
}

async function getSettings() {
  try {
    const [site, checkout] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.checkoutSettings.findUnique({ where: { id: "default" } })
    ]);
    return { site, checkout };
  } catch {
    return { site: null, checkout: null };
  }
}

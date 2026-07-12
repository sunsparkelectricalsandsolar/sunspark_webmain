import { AdminLayout } from "@/components/admin/admin-layout";
import { PendingButton } from "@/components/ui/pending-button";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import { siteConfig } from "@/lib/site-config";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type SettingsView = {
  site: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    facebookUrl?: string;
    mapUrl?: string;
  } | null;
  checkout: {
    whatsappPhone?: string;
    whatsappEnabled: boolean;
    mpesaEnabled: boolean;
  } | null;
  reports: {
    reportTime?: string;
    weekdays?: string;
    enabled?: boolean;
  } | null;
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <AdminLayout title="Settings" subtitle="Business identity, contact links, checkout methods, and payment availability.">
      <form action={updateSettingsAction} className="admin-form">
        <div className="admin-note">
          <strong>Google Merchant feed</strong>
          <a href="/google-merchant.xml" rel="noreferrer" target="_blank">
            /google-merchant.xml
          </a>
        </div>
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
        <details>
          <summary>Daily report delivery</summary>
          <div className="form-grid two">
            <label>Recipient email<input name="reportRecipient" type="email" value={siteConfig.reportEmail} readOnly /></label>
            <label>Send time<input name="reportTime" type="time" defaultValue={settings.reports?.reportTime ?? "20:00"} /></label>
          </div>
          <label>Weekdays (1 Monday to 7 Sunday)<input name="reportWeekdays" defaultValue={settings.reports?.weekdays ?? "1,2,3,4,5"} /></label>
          <label className="check-label"><input name="reportEnabled" type="checkbox" defaultChecked={settings.reports?.enabled ?? false} />Enable automatic daily report</label>
          <small>Automatic delivery requires the HostAfrica cron job and SMTP details during deployment.</small>
        </details>
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
        <PendingButton pendingText="Saving settings...">Save settings</PendingButton>
      </form>
    </AdminLayout>
  );
}

async function getSettings(): Promise<SettingsView> {
  try {
    const settings = await apiFetch<{ store_name?: string; support_email?: string; whatsapp_phone?: string }>("/settings");
    return {
      site: settings ? { name: settings.store_name, email: settings.support_email, phone: siteConfig.phone, location: siteConfig.location, facebookUrl: siteConfig.facebookUrl, mapUrl: siteConfig.mapUrl } : null,
      checkout: settings ? { whatsappPhone: settings.whatsapp_phone, whatsappEnabled: true, mpesaEnabled: false } : null,
      reports: null
    };
  } catch {
    return { site: null, checkout: null, reports: null };
  }
}

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
    recipient?: string;
    reportTime?: string;
    weekdays?: string;
    enabled?: boolean;
  } | null;
};

const messages: Record<string, string> = {
  saved: "Settings saved.",
  save: "Settings could not be saved. Review the fields and try again."
};

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; notice?: string; message?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const settings = await getSettings();
  const feedback = params?.error ? params.message ?? messages[params.error] : params?.notice ? messages[params.notice] : null;

  return (
    <AdminLayout title="Settings" subtitle="Business identity, contact links, checkout methods, and payment availability.">
      {feedback ? <p className={params?.error ? "admin-feedback error" : "admin-feedback success"} role="status">{feedback}</p> : null}
      <form action={updateSettingsAction} className="settings-form">
        <section className="settings-panel">
          <div className="settings-panel-heading">
            <span>01</span>
            <div><h2>Business identity</h2><p>Shown on emails, documents, and customer contact areas.</p></div>
          </div>
          <div className="form-grid two">
            <label>Business name<input name="name" defaultValue={settings.site?.name ?? siteConfig.name} /></label>
            <label>Support email<input name="email" defaultValue={settings.site?.email ?? siteConfig.email} /></label>
            <label>Phone<input name="phone" defaultValue={settings.site?.phone ?? siteConfig.phone} /></label>
            <label>WhatsApp phone<input name="whatsappPhone" defaultValue={settings.checkout?.whatsappPhone ?? siteConfig.whatsappPhone} /></label>
          </div>
          <label>Location<input name="location" defaultValue={settings.site?.location ?? siteConfig.location} /></label>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading">
            <span>02</span>
            <div><h2>Reports</h2><p>Daily sales summary and profit reporting destination.</p></div>
          </div>
          <div className="form-grid two">
            <label>Recipient email<input name="reportRecipient" type="email" defaultValue={settings.reports?.recipient ?? siteConfig.reportEmail} /></label>
            <label>Send time<input name="reportTime" type="time" defaultValue={settings.reports?.reportTime ?? "20:00"} /></label>
          </div>
          <div className="form-grid two">
            <label>Weekdays<input name="reportWeekdays" defaultValue={settings.reports?.weekdays ?? "1,2,3,4,5"} /></label>
            <label className="check-label"><input name="reportEnabled" type="checkbox" defaultChecked={settings.reports?.enabled ?? false} />Automatic daily report</label>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading">
            <span>03</span>
            <div><h2>Checkout and links</h2><p>Customer checkout options and external business links.</p></div>
          </div>
          <div className="form-grid two">
            <label className="check-label"><input name="whatsappEnabled" type="checkbox" defaultChecked={settings.checkout?.whatsappEnabled ?? true} />WhatsApp checkout enabled</label>
            <label className="check-label"><input name="mpesaEnabled" type="checkbox" defaultChecked={settings.checkout?.mpesaEnabled ?? false} />M-Pesa checkout enabled</label>
          </div>
          <label>Facebook URL<input name="facebookUrl" defaultValue={settings.site?.facebookUrl ?? siteConfig.facebookUrl} /></label>
          <label>Map URL<input name="mapUrl" defaultValue={settings.site?.mapUrl ?? siteConfig.mapUrl} /></label>
          <div className="admin-note">
            <strong>Google Merchant feed</strong>
            <a href="/google-merchant.xml" rel="noreferrer" target="_blank">/google-merchant.xml</a>
          </div>
        </section>

        <div className="settings-actions">
          <PendingButton pendingText="Saving settings...">Save settings</PendingButton>
        </div>
      </form>
    </AdminLayout>
  );
}

async function getSettings(): Promise<SettingsView> {
  try {
    const settings = await apiFetch<{ store_name?: string; support_email?: string; report_email?: string; whatsapp_phone?: string }>("/settings");
    return {
      site: settings ? { name: settings.store_name, email: settings.support_email, phone: siteConfig.phone, location: siteConfig.location, facebookUrl: siteConfig.facebookUrl, mapUrl: siteConfig.mapUrl } : null,
      checkout: settings ? { whatsappPhone: settings.whatsapp_phone, whatsappEnabled: true, mpesaEnabled: false } : null,
      reports: settings ? { recipient: settings.report_email } : null
    };
  } catch {
    return { site: null, checkout: null, reports: null };
  }
}

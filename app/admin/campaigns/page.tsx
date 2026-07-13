import { AdminLayout } from "@/components/admin/admin-layout";
import { PendingButton } from "@/components/ui/pending-button";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import { createCampaignAction, deleteCampaignAction, updateCampaignAction } from "./actions";
import { publicImageUrl } from "@/lib/products/images";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const campaigns = await getCampaigns({ q: params?.q, status: params?.status });

  return (
    <AdminLayout title="Campaigns" subtitle="Create storefront promotions for deals, seasonal offers, and featured pushes.">
      <form action="/admin/campaigns" className="admin-filter">
        <input name="q" defaultValue={params?.q ?? ""} placeholder="Search campaigns..." />
        <select name="status" defaultValue={params?.status ?? ""}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      <section className="campaign-admin-layout">
        <form action={createCampaignAction} className="campaign-editor">
          <div className="campaign-editor-heading">
            <span>New Campaign</span>
            <h2>Create a selling offer</h2>
            <p>Use a strong image, short offer text, and a clear action.</p>
          </div>
          <div className="form-grid two">
            <label>Title<input name="title" placeholder="Weekend solar deal" required /></label>
            <label>Badge<input name="badge" placeholder="20% OFF" /></label>
            <label>Offer line<input name="offerLabel" placeholder="Buy inverter + battery at a fixed price" /></label>
            <label>Deal ends<input name="endsAt" type="datetime-local" /></label>
          </div>
          <label>Description<textarea name="description" rows={3} placeholder="Short text that sells the campaign." /></label>
          <div className="form-grid two">
            <label>Button text<input name="ctaLabel" placeholder="Buy this offer" /></label>
            <label>Button link<input name="ctaUrl" placeholder="/store?q=solar" /></label>
          </div>
          <div className="form-grid two">
            <label>Campaign image<input name="images" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <label className="check-label"><input name="isActive" type="checkbox" defaultChecked />Active on website</label>
          </div>
          <PendingButton pendingText="Adding campaign...">Add campaign</PendingButton>
        </form>
      </section>

      <div className="campaign-admin-list">
        {campaigns.map((campaign) => (
          <article className="campaign-admin-row" key={campaign.id}>
            {campaign.imageUrl ? <img className="campaign-row-thumb" alt={campaign.title} src={publicImageUrl(campaign.imageUrl)} /> : <div className="campaign-row-thumb campaign-thumb-empty">No image</div>}
            <div className="campaign-row-main">
              <strong>{campaign.title}</strong>
              <span>{campaign.badge || "No badge"} · {campaign.offerLabel || "No offer line"} · {campaign.endsAt ? `Ends ${new Date(campaign.endsAt).toLocaleString("en-KE")}` : "No end time"}</span>
            </div>
            <span className={campaign.isActive ? "status-pill active" : "status-pill"}>{campaign.isActive ? "Active" : "Hidden"}</span>
            <details className="row-action-menu campaign-row-actions">
              <summary>Actions</summary>
              <div>
                <details className="campaign-inline-editor">
                  <summary>Edit campaign</summary>
                  <form action={updateCampaignAction.bind(null, campaign.id)}>
                    <div className="form-grid two">
                      <label>Title<input name="title" defaultValue={campaign.title} required /></label>
                      <label>Badge<input name="badge" defaultValue={campaign.badge ?? ""} /></label>
                      <label>Offer line<input name="offerLabel" defaultValue={campaign.offerLabel ?? ""} /></label>
                      <label>Deal ends<input name="endsAt" type="datetime-local" defaultValue={campaign.endsAt ? new Date(campaign.endsAt).toISOString().slice(0, 16) : ""} /></label>
                    </div>
                    <label>Description<textarea name="description" defaultValue={campaign.description ?? ""} rows={2} /></label>
                    <div className="form-grid three">
                      <label>Button text<input name="ctaLabel" defaultValue={campaign.ctaLabel ?? ""} /></label>
                      <label>Button link<input name="ctaUrl" defaultValue={campaign.ctaUrl ?? ""} /></label>
                      <label>Replace image<input name="images" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                    </div>
                    <div className="campaign-card-actions">
                      <label className="check-label"><input name="isActive" type="checkbox" defaultChecked={campaign.isActive} />Active</label>
                      <PendingButton className="secondary-btn" pendingText="Saving campaign...">Save campaign</PendingButton>
                    </div>
                  </form>
                </details>
                <form action={deleteCampaignAction.bind(null, campaign.id)}>
                  <button className="danger-btn" type="submit">Delete campaign</button>
                </form>
              </div>
            </details>
          </article>
        ))}
        {!campaigns.length ? <p className="empty-state">No campaigns yet. Create the first active offer.</p> : null}
      </div>
    </AdminLayout>
  );
}

async function getCampaigns(input: { q?: string; status?: string }) {
  const q = input.q?.trim();
  try {
    const campaigns = await apiFetch<Campaign[]>("/admin/campaigns");
    return campaigns.filter((campaign) => {
      const matchesQ = q ? `${campaign.title} ${campaign.description ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesStatus = input.status === "active" ? campaign.isActive : input.status === "hidden" ? !campaign.isActive : true;
      return matchesQ && matchesStatus;
    });
  } catch {
    return [];
  }
}

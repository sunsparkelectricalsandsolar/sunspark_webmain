import { AdminLayout } from "@/components/admin/admin-layout";
import { PendingButton } from "@/components/ui/pending-button";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import { createCampaignAction, updateCampaignAction } from "./actions";
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
      <form action={createCampaignAction} className="admin-form">
        <div className="form-grid three">
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Campaign image
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
          <label className="check-label">
            <input name="isActive" type="checkbox" defaultChecked />
            Active
          </label>
        </div>
        <label>
          Description
          <input name="description" />
        </label>
        <PendingButton pendingText="Adding campaign...">Add campaign</PendingButton>
      </form>
      <div className="category-admin-list">
        {campaigns.map((campaign) => (
          <form action={updateCampaignAction.bind(null, campaign.id)} className="admin-form" key={campaign.id}>
            <div className="form-grid three">
              <label>
                Title
                <input name="title" defaultValue={campaign.title} required />
              </label>
              <label>
                Replace image
                <input name="images" type="file" accept="image/jpeg,image/png,image/webp" />
              </label>
              <label className="check-label">
                <input name="isActive" type="checkbox" defaultChecked={campaign.isActive} />
                Active
              </label>
            </div>
            {campaign.imageUrl ? <img className="campaign-thumb" alt={campaign.title} src={publicImageUrl(campaign.imageUrl)} /> : null}
            <label>
              Description
              <input name="description" defaultValue={campaign.description ?? ""} />
            </label>
            <PendingButton className="secondary-btn" pendingText="Saving campaign...">Save campaign</PendingButton>
          </form>
        ))}
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

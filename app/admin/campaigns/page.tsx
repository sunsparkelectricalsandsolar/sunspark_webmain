import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createCampaignAction, updateCampaignAction } from "./actions";

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
      <form action={createCampaignAction} className="admin-form" encType="multipart/form-data">
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
        <button className="primary-btn" type="submit">Add campaign</button>
      </form>
      <div className="category-admin-list">
        {campaigns.map((campaign) => (
          <form action={updateCampaignAction.bind(null, campaign.id)} className="admin-form" encType="multipart/form-data" key={campaign.id}>
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
            {campaign.imageUrl ? <img className="campaign-thumb" alt={campaign.title} src={campaign.imageUrl} /> : null}
            <label>
              Description
              <input name="description" defaultValue={campaign.description ?? ""} />
            </label>
            <button className="secondary-btn" type="submit">Save campaign</button>
          </form>
        ))}
      </div>
    </AdminLayout>
  );
}

async function getCampaigns(input: { q?: string; status?: string }) {
  const q = input.q?.trim();
  try {
    return prisma.campaign.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { slug: { contains: q } }
              ]
            }
          : {}),
        ...(input.status === "active" ? { isActive: true } : {}),
        ...(input.status === "hidden" ? { isActive: false } : {})
      },
      orderBy: { updatedAt: "desc" }
    });
  } catch {
    return [];
  }
}

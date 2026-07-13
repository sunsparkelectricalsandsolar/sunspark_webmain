import Link from "next/link";
import { publicImageUrl } from "@/lib/products/images";
import type { Campaign } from "@/lib/types";

export function CampaignFeature({ campaign }: { campaign?: Campaign | null }) {
  if (!campaign) {
    return (
      <aside className="campaign-feature campaign-feature-empty">
        <span>Sunspark Deals</span>
        <strong>Talk to us for today&apos;s best electrical and solar offers.</strong>
        <Link href="/store">Browse store</Link>
      </aside>
    );
  }

  const href = campaign.ctaUrl || "/store";

  return (
    <aside className="campaign-feature">
      {campaign.imageUrl ? <img alt={campaign.title} src={publicImageUrl(campaign.imageUrl)} /> : null}
      <div>
        <span>{campaign.badge || "Limited offer"}</span>
        <strong>{campaign.title}</strong>
        {campaign.offerLabel ? <em>{campaign.offerLabel}</em> : null}
        {campaign.description ? <p>{campaign.description}</p> : null}
        <Link href={href}>{campaign.ctaLabel || "Shop offer"}</Link>
      </div>
    </aside>
  );
}

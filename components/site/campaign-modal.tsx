"use client";

import { useEffect, useState } from "react";
import { publicImageUrl } from "@/lib/products/images";

type Campaign = { id: string; title: string; description: string | null; imageUrl: string | null };

export function CampaignModal({ campaigns }: { campaigns: Campaign[] }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const next = campaigns.find((item) => !sessionStorage.getItem(`sunspark-campaign-${item.id}`));
    setCampaign(next ?? null);
  }, [campaigns]);

  function close() {
    if (campaign) sessionStorage.setItem(`sunspark-campaign-${campaign.id}`, "seen");
    setCampaign(null);
  }

  if (!campaign) return null;
  return <div aria-label="Campaign" className="campaign-modal-backdrop" role="dialog" aria-modal="true">
    <section className="campaign-modal">
      <button aria-label="Close campaign" className="campaign-close" onClick={close} type="button">Close</button>
      {campaign.imageUrl ? <img alt={campaign.title} src={publicImageUrl(campaign.imageUrl)} /> : null}
      <div><p className="eyebrow">Sunspark offer</p><h2>{campaign.title}</h2>{campaign.description ? <p>{campaign.description}</p> : null}<button className="primary-btn" onClick={close} type="button">Continue shopping</button></div>
    </section>
  </div>;
}

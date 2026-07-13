"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicImageUrl } from "@/lib/products/images";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  badge: string | null;
  offerLabel: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  endsAt: string | Date | null;
};

export function CampaignModal({ campaigns }: { campaigns: Campaign[] }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const current = Date.now();
    const next = campaigns.find((item) => {
      const expired = item.endsAt ? new Date(item.endsAt).getTime() <= current : false;
      return !expired && !sessionStorage.getItem(`sunspark-campaign-${item.id}`);
    });
    setCampaign(next ?? null);
  }, [campaigns]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function close() {
    if (campaign) sessionStorage.setItem(`sunspark-campaign-${campaign.id}`, "seen");
    setCampaign(null);
  }

  if (!campaign) return null;
  const remaining = campaign.endsAt ? Math.max(new Date(campaign.endsAt).getTime() - now, 0) : 0;
  if (campaign.endsAt && remaining <= 0) {
    window.setTimeout(() => close(), 0);
    return null;
  }
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const href = campaign.ctaUrl || "/store";

  return <div aria-label="Campaign" className="campaign-modal-backdrop" role="dialog" aria-modal="true">
    <section className="campaign-modal">
      <button aria-label="Close campaign" className="campaign-close" onClick={close} type="button">X</button>
      <div className="campaign-modal-media">
        {campaign.imageUrl ? <img alt={campaign.title} src={publicImageUrl(campaign.imageUrl)} /> : null}
        <span>{campaign.badge || "Sunspark deal"}</span>
      </div>
      <div className="campaign-modal-copy">
        <p className="eyebrow">Limited offer</p>
        <h2>{campaign.title}</h2>
        {campaign.offerLabel ? <strong>{campaign.offerLabel}</strong> : null}
        {campaign.description ? <p>{campaign.description}</p> : null}
        {campaign.endsAt ? <div className="campaign-countdown" aria-label="Deal countdown"><span>{days}<small>Days</small></span><span>{hours}<small>Hours</small></span><span>{minutes}<small>Min</small></span><span>{seconds}<small>Sec</small></span></div> : null}
        <div className="campaign-modal-actions">
          <Link className="primary-btn" href={href} onClick={close}>{campaign.ctaLabel || "Buy this offer"}</Link>
          <button className="secondary-btn" onClick={close} type="button">Continue shopping</button>
        </div>
      </div>
    </section>
  </div>;
}

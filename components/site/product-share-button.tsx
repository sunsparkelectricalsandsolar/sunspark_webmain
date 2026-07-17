"use client";

import { useState } from "react";

export function ProductShareButton({
  text,
  title,
  url
}: {
  text: string;
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function shareProduct() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="product-share-btn" onClick={shareProduct} type="button">
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M18 16.1c-.9 0-1.7.4-2.2 1l-7-4.1c.1-.3.2-.6.2-1s-.1-.7-.2-1l7-4.1A2.8 2.8 0 1 0 15 5c0 .4.1.7.2 1l-7 4.1a2.8 2.8 0 1 0 0 3.8l7 4.1c-.1.3-.2.6-.2 1a3 3 0 1 0 3-2.9Z" />
        </svg>
      </span>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

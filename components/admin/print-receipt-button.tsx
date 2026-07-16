"use client";

import { useState } from "react";

export function PrintReceiptButton({ href, label = "Download PDF" }: { href: string; label?: string }) {
  const [downloading, setDownloading] = useState(false);

  return (
    <a
      aria-busy={downloading}
      className="secondary-btn"
      download
      href={href}
      onClick={() => {
        setDownloading(true);
        window.setTimeout(() => setDownloading(false), 1800);
      }}
    >
      {downloading ? "Preparing..." : label}
    </a>
  );
}

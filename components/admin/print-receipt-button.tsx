"use client";

export function PrintReceiptButton({ href, label = "Download PDF" }: { href: string; label?: string }) {
  return <a className="secondary-btn" download href={href}>{label}</a>;
}

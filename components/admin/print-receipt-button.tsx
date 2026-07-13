"use client";

export function PrintReceiptButton({ label = "Download PDF" }: { label?: string }) {
  return <button className="secondary-btn" onClick={() => window.print()} type="button">{label}</button>;
}

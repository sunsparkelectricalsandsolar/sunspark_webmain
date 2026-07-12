"use client";

export function PrintReceiptButton({ label = "Print document" }: { label?: string }) {
  return <button className="secondary-btn" onClick={() => window.print()} type="button">{label}</button>;
}

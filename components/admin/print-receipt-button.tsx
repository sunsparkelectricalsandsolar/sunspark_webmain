"use client";

export function PrintReceiptButton() {
  return <button className="secondary-btn" onClick={() => window.print()} type="button">Print receipt</button>;
}

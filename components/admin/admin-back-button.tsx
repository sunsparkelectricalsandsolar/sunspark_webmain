"use client";

export function AdminBackButton() {
  return (
    <button className="admin-back-button" onClick={() => window.history.back()} type="button">
      Back
    </button>
  );
}

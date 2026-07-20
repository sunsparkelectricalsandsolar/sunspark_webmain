"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message?.includes("Admin API")
    ? error.message
    : "The admin backend did not respond correctly. Check the admin API token and backend status, then try again.";

  return (
    <main className="admin-error-page">
      <section className="admin-error-card">
        <span className="eyebrow">Admin connection</span>
        <h1>The dashboard needs another try.</h1>
        <p>{message}</p>
        <div className="admin-error-actions">
          <button className="primary-btn" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="secondary-btn" href="/admin">
            Back to dashboard
          </Link>
          <Link className="secondary-btn" href="/admin/login">
            Admin login
          </Link>
        </div>
      </section>
    </main>
  );
}

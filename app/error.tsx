"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="container friendly-state">
        <p className="eyebrow">Connection delay</p>
        <h1>The page needs another try.</h1>
        <p>The server did not finish loading this page. Try again, or continue shopping while it recovers.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={reset} type="button">Try again</button>
          <Link className="secondary-btn" href="/store#top">Open store</Link>
        </div>
      </div>
    </section>
  );
}

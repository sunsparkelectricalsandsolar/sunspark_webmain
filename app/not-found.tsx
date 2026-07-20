import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container friendly-state">
        <p className="eyebrow">Page unavailable</p>
        <h1>We could not find that page.</h1>
        <p>The product may have moved, or the link may be incomplete. You can continue shopping from the store.</p>
        <div className="hero-actions">
          <Link className="primary-btn" href="/store#top">Open store</Link>
          <Link className="secondary-btn" href="/#top">Home</Link>
        </div>
      </div>
    </section>
  );
}

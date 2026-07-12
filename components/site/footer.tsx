import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section>
          <h2>Sunspark Electrical and Solar</h2>
          <p>{siteConfig.location}</p>
          <p>
            <a href={`https://wa.me/${siteConfig.whatsappPhone}`}>WhatsApp {siteConfig.phone}</a>
          </p>
        </section>
        <section>
          <h2>Shop</h2>
          <Link href="/category/solar">Solar</Link>
          <Link href="/category/electricals">Electricals</Link>
          <Link href="/category/electronics">Electronics</Link>
        </section>
        <section>
          <h2>Support</h2>
          <Link href="/account">My account</Link>
          <Link href="/checkout">Checkout</Link>
          <a href={siteConfig.facebookUrl}>Facebook</a>
        </section>
      </div>
    </footer>
  );
}

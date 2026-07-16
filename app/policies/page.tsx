import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Delivery, Privacy and FAQ",
  description: "Sunspark Electrical and Solar delivery, privacy and shopping questions."
};

export default function PoliciesPage() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    { label: "Electricals", href: "/category/electricals" },
    { label: "Electronics", href: "/category/electronics" },
    { label: "Solar & Accessories", href: "/category/solar-accessories" },
    { label: "Account", href: "/account" }
  ];

  return (
    <section className="policy-experiment-page">
      <header className="policy-experiment-header">
        <nav className="policy-experiment-nav" aria-label="Experimental Sunspark navigation">
          <div className="container">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </nav>
        <div className="container policy-experiment-brandbar">
          <Link aria-label="Sunspark home" className="policy-experiment-logo" href="/">
            <Image alt="Sunspark Electricals and Solar" height={300} priority src="/logo-header.png" width={900} />
          </Link>
          <form action="/store" className="policy-experiment-search">
            <label htmlFor="policy-search">Find products</label>
            <div>
              <input id="policy-search" name="q" placeholder="Search cables, breakers, sockets..." />
              <button type="submit">Search</button>
            </div>
          </form>
        </div>
      </header>

      <div className="container policy-experiment-shell">
        <div className="policy-experiment-hero">
          <p className="eyebrow">Sunspark support</p>
          <h1>Delivery, Privacy and FAQ</h1>
          <p>Quick answers for shopping electricals, electronics, and solar accessories from our Nairobi CBD shop.</p>
          <div className="policy-hero-actions">
            <Link className="primary-btn" href="/store">Browse store</Link>
            <Link className="secondary-btn" href={`https://wa.me/${siteConfig.whatsappPhone}`}>WhatsApp us</Link>
          </div>
        </div>

        <nav className="policy-tabs" aria-label="Policy sections">
          <a href="#delivery">Shipping and delivery</a>
          <a href="#privacy">Privacy policy</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="policy-card-grid">
          <article id="delivery" className="policy-card">
            <h2>Shipping and Delivery Policy</h2>
            <p>Sunspark serves customers from Nairobi CBD, Duruma Road, Downtown Tower, second floor, shop number 8.</p>
            <p>Orders can be collected from the shop or delivered within Nairobi after stock and delivery cost are confirmed by the team.</p>
            <p>For urgent electrical materials, confirm availability on WhatsApp before payment so the correct size, quantity and brand are reserved.</p>
            <p>Fragile, bulky or project materials may require a rider, pickup, courier, or customer-arranged transport depending on the order.</p>
          </article>

          <article id="privacy" className="policy-card">
            <h2>Privacy Policy</h2>
            <p>Sunspark uses customer details only to process orders, prepare invoices or quotations, arrange delivery, and respond to support requests.</p>
            <p>Account details, order history, phone numbers and delivery notes are not sold. Admins use them only for shop operations.</p>
            <p>Payment confirmation is handled through the selected checkout method. Do not send private PINs or passwords to anyone.</p>
          </article>

          <article id="faq" className="policy-card policy-card-wide">
            <h2>FAQ</h2>
            <h3>Can I ask for a quotation before buying?</h3>
            <p>Yes. Send the product list on WhatsApp or use the site order flow. The team can prepare a quotation or invoice.</p>
            <h3>Are all imported products visible to customers?</h3>
            <p>No. Products can stay hidden until stock, images and details are confirmed.</p>
            <h3>How do I confirm the exact location?</h3>
            <p>Use the map link in the footer or contact the shop on WhatsApp.</p>
            <Link className="primary-btn" href={`https://wa.me/${siteConfig.whatsappPhone}`}>
              Contact Sunspark
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

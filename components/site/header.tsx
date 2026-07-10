import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "Electricals", href: "/category/electricals" },
  { label: "Solar", href: "/category/solar" },
  { label: "Electronics", href: "/category/electronics" },
  { label: "Account", href: "/account" }
];

export function Header() {
  return (
    <header>
      <div className="top-header">
        <div className="container top-header-inner">
          <div className="contact-links">
            <a href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <span>{siteConfig.location}</span>
          </div>
          <div className="contact-links right">
            <span>{siteConfig.currency}</span>
            <Link href="/account">My Account</Link>
          </div>
        </div>
      </div>
      <div className="main-header">
        <div className="container main-header-inner">
          <Link className="logo-link" href="/" aria-label="Sunspark home">
            <Image src="/logo.jpg" alt="Sunspark Electrical and Solar" width={140} height={64} priority />
          </Link>
          <form className="header-search" action="/store">
            <select name="category" aria-label="Product category">
              <option value="">All Categories</option>
              <option value="electricals">Electricals</option>
              <option value="solar">Solar</option>
              <option value="electronics">Electronics</option>
            </select>
            <input name="q" placeholder="Search products" aria-label="Search products" />
            <button type="submit">Search</button>
          </form>
          <nav className="header-actions" aria-label="Shop actions">
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/cart">Cart</Link>
          </nav>
        </div>
      </div>
      <nav className="navigation" aria-label="Main navigation">
        <div className="container nav-scroll">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

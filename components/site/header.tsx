import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { getCart } from "@/lib/cart/cart-service";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "Solar", href: "/category/solar" },
  { label: "Electricals", href: "/category/electricals" },
  { label: "Electronics", href: "/category/electronics" },
  { label: "Account", href: "/account" }
];

export async function Header() {
  const cart = await getCart();
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
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
            <Link className="icon-link wishlist-link" href="/wishlist" aria-label="Wishlist">
              <span aria-hidden="true">♡</span>
              <strong>Wishlist</strong>
            </Link>
            <Link className="icon-link cart-link" href="/cart" aria-label={`${cartCount} items in cart`}>
              <span aria-hidden="true">▣</span>
              <strong>Cart</strong>
              <em aria-hidden="true">{cartCount}</em>
            </Link>
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

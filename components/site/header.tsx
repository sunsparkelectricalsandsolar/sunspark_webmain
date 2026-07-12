import Image from "next/image";
import Link from "next/link";
import { getCart } from "@/lib/cart/cart-service";
import { siteConfig } from "@/lib/site-config";

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
          <Link aria-label="Sunspark home" className="logo-link" href="/">
            <Image alt="Sunspark Electrical and Solar" height={54} priority src="/logo.jpg" width={118} />
          </Link>
          <form action="/store" className="header-search">
            <select aria-label="Product category" name="category">
              <option value="">All Categories</option>
              <option value="electricals">Electricals</option>
              <option value="solar">Solar</option>
              <option value="electronics">Electronics</option>
            </select>
            <input aria-label="Search products" name="q" placeholder="Search products" />
            <button aria-label="Search products" type="submit">Go</button>
          </form>
          <nav aria-label="Shop actions" className="header-actions">
            <Link aria-label="Wishlist" className="icon-link wishlist-link" href="/wishlist">
              <span aria-hidden="true">W</span>
              <strong>Wishlist</strong>
            </Link>
            <Link aria-label={`${cartCount} items in cart`} className="icon-link cart-link" href="/cart">
              <span aria-hidden="true">C</span>
              <strong>Cart</strong>
              <em aria-hidden="true">{cartCount}</em>
            </Link>
          </nav>
        </div>
      </div>
      <nav aria-label="Main navigation" className="navigation">
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

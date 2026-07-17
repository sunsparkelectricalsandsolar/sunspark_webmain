import Image from "next/image";
import Link from "next/link";
import { HeaderMenu } from "@/components/site/header-menu";
import { getCart } from "@/lib/cart/cart-service";
import { getStoreCategories } from "@/lib/products/queries";

export async function Header() {
  const [cart, categories] = await Promise.all([getCart(), getStoreCategories()]);
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    ...categories.slice(0, 5).map((category) => ({ label: category.name, href: `/category/${category.slug}` })),
    { label: "Account", href: "/account" }
  ];

  return (
    <header className="site-header">
      <nav aria-label="Main navigation" className="navigation">
        <div className="container nav-scroll">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="main-header">
        <div className="container main-header-inner">
          <Link aria-label="Sunspark home" className="logo-link" href="/">
            <Image alt="Sunspark Electricals and Solar" height={300} priority src="/logo-header.png" width={900} />
          </Link>
          <form action="/store" className="header-search">
            <input aria-label="Search products" name="q" placeholder="Search products, hot deals..." />
            <button aria-label="Search products" type="submit">Search</button>
          </form>
          <nav aria-label="Shop actions" className="header-actions">
            <Link aria-label={`${cartCount} items in cart`} className="icon-link cart-link" href="/cart">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M7 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM4.2 4H2V2h3.8l1 4H21l-2 8.5H8.2L7.7 16H19v2H6.1L3.9 6 4.2 4Zm3.1 4 .9 4.5h9.2L18.5 8H7.3Z" />
                </svg>
              </span>
              <strong>Cart</strong>
              <em aria-hidden="true">{cartCount}</em>
            </Link>
            <Link aria-label="Wishlist" className="icon-link wishlist-link" href="/wishlist">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M12 20s-7-4.4-9.4-8.3C.6 8.4 2.5 4.5 6.2 4.5c2 0 3.3 1 3.8 2 0.5-1 1.8-2 3.8-2 3.7 0 5.6 3.9 3.6 7.2C19 15.6 12 20 12 20Z" />
                </svg>
              </span>
              <strong>Wishlist</strong>
            </Link>
          </nav>
          <HeaderMenu cartCount={cartCount} categories={categories.map((category) => ({ name: category.name, slug: category.slug }))} />
        </div>
      </div>
    </header>
  );
}

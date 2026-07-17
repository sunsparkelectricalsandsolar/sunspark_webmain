"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HeaderMenuCategory = {
  name: string;
  slug: string;
};

export function HeaderMenu({
  cartCount,
  categories
}: {
  cartCount: number;
  categories: HeaderMenuCategory[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="site-menu-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      {open ? <button aria-label="Close menu" className="site-menu-backdrop" onClick={() => setOpen(false)} type="button" /> : null}
      <aside className={`site-side-menu${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="site-side-menu-head">
          <strong>Sunspark</strong>
          <button aria-label="Close menu" onClick={() => setOpen(false)} type="button">Close</button>
        </div>
        <nav aria-label="Mobile shop menu">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/store" onClick={() => setOpen(false)}>Store</Link>
          {categories.map((category) => (
            <Link href={`/category/${category.slug}`} key={category.slug} onClick={() => setOpen(false)}>
              {category.name}
            </Link>
          ))}
        </nav>
        <div className="site-side-actions">
          <Link href="/cart" onClick={() => setOpen(false)}>Cart <span>{cartCount}</span></Link>
          <Link href="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link>
          <Link href="/account" onClick={() => setOpen(false)}>My Account</Link>
        </div>
      </aside>
    </>
  );
}

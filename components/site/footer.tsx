import Link from "next/link";
import { getStoreCategories } from "@/lib/products/queries";
import { siteConfig } from "@/lib/site-config";

export async function Footer() {
  const categories = await getStoreCategories();

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
        <section className="footer-links">
          <h2>Shop</h2>
          {categories.slice(0, 5).map((category) => (
            <Link href={`/category/${category.slug}`} key={category.id}>{category.name}</Link>
          ))}
          {!categories.length ? <Link href="/store">Store</Link> : null}
        </section>
        <section className="footer-links">
          <h2>Support</h2>
          <Link href="/account">My account</Link>
          <Link href="/checkout">Checkout</Link>
          <a href={siteConfig.facebookUrl}>Facebook</a>
        </section>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { clearSession } from "@/lib/auth/session";
import { requireCustomer } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/site/product-card";
import { getHomeData } from "@/lib/products/queries";

async function logoutAction() {
  "use server";

  await clearSession();
  redirect("/");
}

export default async function AccountPage() {
  const user = await requireCustomer();
  const { categories, products } = await getHomeData();
  const visibleProducts = products.slice(0, 8);

  return (
    <>
      <section className="section account-hero">
        <div className="container account-grid">
          <div>
            <p className="eyebrow">My Account</p>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <div className="account-quick-links" aria-label="Popular departments">
              {categories.slice(0, 4).map((category) => (
                <Link href={`/category/${category.slug}`} key={category.id}>{category.name}</Link>
              ))}
            </div>
          </div>
          <div className="account-panel">
            <Link href="/account/orders"><strong>Orders</strong><span>Track purchases and invoices</span></Link>
            <Link href="/wishlist"><strong>Wishlist</strong><span>Saved products</span></Link>
            <Link href="/checkout"><strong>Checkout</strong><span>Complete your cart</span></Link>
            <form action={logoutAction}>
              <button className="secondary-btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Continue shopping</p>
              <h3>Recommended products</h3>
            </div>
            <Link href="/store">View store</Link>
          </div>
          {visibleProducts.length ? (
            <div className="product-slider">
              {visibleProducts.map((product) => <ProductCard product={product} key={product.id} />)}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Products are being updated.</strong>
              <p>Check the store shortly or contact Sunspark for a quick quote.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

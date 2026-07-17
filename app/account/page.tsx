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
  const { products } = await getHomeData();
  const visibleProducts = products.slice(0, 8);

  return (
    <>
      <section className="section account-hero">
        <div className="container account-strip">
          <div>
            <p className="eyebrow">My Account</p>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button className="secondary-btn" type="submit">
              Sign out
            </button>
          </form>
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
              <strong>Find what you need faster.</strong>
              <p>Search the store or request a quick quote from Sunspark.</p>
              <Link className="primary-btn" href="/store">Browse store</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

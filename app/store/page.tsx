import { ProductCard } from "@/components/site/product-card";
import { getStoreCategories, getStoreProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getStoreProducts({ q: params?.q, category: params?.category }),
    getStoreCategories()
  ]);

  return (
    <section className="section">
      <div className="container store-layout">
        <aside className="store-aside">
          <h1>Store</h1>
          <p>Electricals, electronics, and solar products priced in KSH.</p>
          <form className="stack-form" action="/store">
            <label>
              Search
              <input name="q" defaultValue={params?.q ?? ""} placeholder="Cable, inverter, breaker..." />
            </label>
            <label>
              Category
              <select name="category" defaultValue={params?.category ?? ""}>
                <option value="">All</option>
                {categories.map((category) => (
                  <option value={category.slug} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-btn" type="submit">
              Filter
            </button>
          </form>
        </aside>
        <div>
          <div className="store-toolbar">
            <strong>{products.length} product{products.length === 1 ? "" : "s"}</strong>
          </div>
          {products.length ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No products yet</h2>
              <p>Add products from the admin dashboard and they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

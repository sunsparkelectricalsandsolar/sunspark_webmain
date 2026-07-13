import Link from "next/link";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductCard } from "@/components/site/product-card";
import { getHomeData } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

function chunkProducts<T>(products: T[], size: number) {
  const rows: T[][] = [];
  for (let index = 0; index < products.length; index += size) {
    rows.push(products.slice(index, index + size));
  }
  return rows;
}

export default async function HomePage() {
  const { categories: displayCategories, categorySections, products, brands } = await getHomeData();
  const productSections = categorySections.filter((category) => category.products.length);

  return (
    <>
      <section className="section category-section">
        <div className="container category-grid shop-grid">
          {displayCategories.map((category) => (
            <CategoryTile category={category} key={category.slug} />
          ))}
        </div>
      </section>
      {brands.length ? <section className="section brand-section"><div className="container"><details className="brand-disclosure"><summary><span>Shop by Brand</span><Link href="/store">View all</Link></summary><div className="brand-list">{brands.map((brand) => <Link href={`/store?q=${encodeURIComponent(brand)}`} key={brand}>{brand}</Link>)}</div></details></div></section> : null}
      {productSections.map((category) => (
          <section className="section product-section" key={category.id}>
            <div className="container">
              <div className="section-title">
                <h3>{category.name} Products</h3>
                <Link href={`/category/${category.slug}`}>View all</Link>
              </div>
              {chunkProducts(category.products, 12).map((row, index) => (
                <div className="product-slider product-slider-row" aria-label={`${category.name} products row ${index + 1}`} key={index}>
                  {row.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      {!productSections.length ? (
        <section className="section product-section">
          <div className="container">
            <div className="section-title">
              <h3>Featured Products</h3>
              <div className="section-tabs">
                {displayCategories.map((category) => (
                  <Link href={`/category/${category.slug}`} key={category.slug}>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            {products.length ? (
              <div className="product-slider" aria-label="Featured products">
                {products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="empty-products">
                <h2>Products are being updated</h2>
                <p>Check the store page or contact Sunspark for the latest stock.</p>
                <Link className="primary-btn" href="/store">Open store</Link>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

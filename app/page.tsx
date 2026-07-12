import Link from "next/link";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductCard } from "@/components/site/product-card";
import { defaultCategories } from "@/lib/products/default-categories";
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
  const { categories: dbCategories, categorySections, products, brands } = await getHomeData();
  const displayCategories = dbCategories.length
    ? dbCategories
    : defaultCategories.map((category) => ({
        name: category.name,
        slug: category.slug,
        description: category.description
      }));

  return (
    <>
      <section className="section category-section">
        <div className="container category-grid shop-grid">
          {displayCategories.map((category) => (
            <CategoryTile category={category} key={category.slug} />
          ))}
        </div>
      </section>
      {brands.length ? <section className="section brand-section"><div className="container"><div className="section-title"><h3>Shop by Brand</h3><Link href="/store">View all</Link></div><div className="brand-list">{brands.map((brand) => <Link href={`/store?q=${encodeURIComponent(brand)}`} key={brand}>{brand}</Link>)}</div></div></section> : null}
      {categorySections.map((category) => (
          <section className="section product-section" key={category.id}>
            <div className="container">
              <div className="section-title">
                <h3>{category.name} Products</h3>
                <Link href={`/category/${category.slug}`}>View all</Link>
              </div>
              {category.products.length ? chunkProducts(category.products, 12).map((row, index) => (
                <div className="product-slider product-slider-row" aria-label={`${category.name} products row ${index + 1}`} key={index}>
                  {row.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              )) : <div className="category-empty"><span>New products are being added.</span><Link href={`/category/${category.slug}`}>Browse category</Link></div>}
            </div>
          </section>
        ))}
      {!categorySections.length ? (
        <section className="section product-section">
          <div className="container">
            <div className="section-title">
              <h3>Solar Products</h3>
              <div className="section-tabs">
                {displayCategories.map((category) => (
                  <Link href={`/category/${category.slug}`} key={category.slug}>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            {products.length ? (
              <div className="product-slider" aria-label="Solar products">
                {products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="empty-products">
                <h2>Products coming soon</h2>
                <p>Use the admin dashboard to add Sunspark products and stock.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}

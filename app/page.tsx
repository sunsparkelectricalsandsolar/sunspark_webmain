import Link from "next/link";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductCard } from "@/components/site/product-card";
import { getHomeData } from "@/lib/products/queries";

const categories = [
  {
    name: "Solar",
    description: "Panels, inverters, batteries, charge controllers, and complete kits.",
    href: "/category/solar"
  },
  {
    name: "Electricals",
    description: "Cables, switches, breakers, fittings, and installation essentials.",
    href: "/category/electricals"
  },
  {
    name: "Electronics",
    description: "Reliable electronics and accessories for home and business.",
    href: "/category/electronics"
  }
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories: dbCategories, categorySections, products } = await getHomeData();
  const displayCategories = dbCategories.length
    ? dbCategories
    : categories.map((category) => ({
        name: category.name,
        slug: category.name.toLowerCase(),
        description: category.description
      }));

  return (
    <>
      <section className="section">
        <div className="container category-grid shop-grid">
          {displayCategories.map((category) => (
            <CategoryTile category={category} key={category.slug} />
          ))}
        </div>
      </section>
      {categorySections.length ? (
        categorySections.map((category) => (
          <section className="section product-section" key={category.id}>
            <div className="container">
              <div className="section-title">
                <h3>{category.name} Products</h3>
                <Link href={`/category/${category.slug}`}>View all</Link>
              </div>
              <div className="product-slider" aria-label={`${category.name} products`}>
                {category.products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            </div>
          </section>
        ))
      ) : (
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
      )}
    </>
  );
}

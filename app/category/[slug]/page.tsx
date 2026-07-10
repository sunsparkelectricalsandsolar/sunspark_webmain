import { notFound } from "next/navigation";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductCard } from "@/components/site/product-card";
import { getCategoryBySlug } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Category</p>
          <h1>{category.name}</h1>
          <p>{category.description ?? "Browse products in this Sunspark category."}</p>
        </div>
        {category.children.length ? (
          <div className="category-grid">
            {category.children.map((child) => (
              <CategoryTile category={child} key={child.id} />
            ))}
          </div>
        ) : null}
        {category.products.length ? (
          <div className="product-grid">
            {category.products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No products in {category.name} yet</h2>
            <p>Products added by admin will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

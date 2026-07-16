import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductCard } from "@/components/site/product-card";
import { getCategoryBySlug } from "@/lib/products/queries";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return {};

  const title = `${category.name} Products`;
  const description = category.description || `Shop ${category.name.toLowerCase()} products from ${siteConfig.name} in Nairobi CBD.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}/category/${category.slug}`
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/category/${category.slug}`,
      type: "website"
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Products`,
    description: category.description || `Products under ${category.name}`,
    url: `${siteConfig.url}/category/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: category.products.slice(0, 60).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.url}/product/${product.slug}`,
        name: product.name
      }))
    }
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
        type="application/ld+json"
      />
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
            <h2>{category.name} products</h2>
            <p>Use the store search to browse available stock, or contact Sunspark for current pricing and availability.</p>
          </div>
        )}
        </div>
      </section>
    </>
  );
}

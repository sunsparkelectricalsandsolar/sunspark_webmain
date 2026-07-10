import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCartAndRedirectAction } from "@/app/cart/actions";
import { addWishlistAction } from "@/app/wishlist/actions";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { formatMoney } from "@/lib/money";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const related = await getRelatedProducts(product.categoryId, product.id);

  return (
    <>
      <section className="section">
        <div className="container product-detail">
          <ProductGallery images={product.images} name={product.name} />
          <div className="product-summary">
            <p className="eyebrow">{product.category.name}</p>
            <h1>{product.name}</h1>
            <p className="sku">SKU: {product.sku}</p>
            <div className="detail-price">
              <strong>{formatMoney(product.priceCents)}</strong>
              {product.compareAtCents ? <span>{formatMoney(product.compareAtCents)}</span> : null}
            </div>
            <p className={product.stockQuantity > 0 ? "stock ok" : "stock out"}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} available` : "Out of stock"}
            </p>
            {product.shortDescription ? <p>{product.shortDescription}</p> : null}
            <div className="hero-actions">
              <form action={addToCartAndRedirectAction.bind(null, product.slug)}>
                <button className="primary-btn" disabled={product.stockQuantity <= 0} type="submit">
                  Add to cart
                </button>
              </form>
              <form action={addWishlistAction.bind(null, product.slug)}>
                <button className="secondary-btn" type="submit">
                  Wishlist
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container product-description">
          <h2>Product Details</h2>
          <p>{product.description ?? "More specifications can be added from the admin dashboard."}</p>
        </div>
      </section>
      {related.length ? (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <h2>Related Products</h2>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard product={item} key={item.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

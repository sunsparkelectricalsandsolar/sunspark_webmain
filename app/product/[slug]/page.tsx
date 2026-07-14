import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addSelectedToCartAndRedirectAction } from "@/app/cart/actions";
import { addWishlistAction } from "@/app/wishlist/actions";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { ProductOptionPurchase } from "@/components/site/product-option-purchase";
import { PendingButton } from "@/components/ui/pending-button";
import { absoluteUrl, productUrl } from "@/lib/merchant/feed";
import { getPrimaryImage } from "@/lib/products/images";
import { getProductBySlug, getProductCompanions, getRelatedProducts } from "@/lib/products/queries";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  const image = getPrimaryImage(product.images);
  const url = productUrl(product.slug);
  const description =
    product.seoDescription || product.shortDescription || product.description || `Buy ${product.name} from ${siteConfig.name}.`;

  return {
    title: product.seoTitle || product.name,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: product.name,
      description,
      url,
      type: "website",
      images: image ? [{ url: absoluteUrl(image.url) }] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const [related, companions] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getProductCompanions(product.categoryId, product.id)
  ]);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: {
      "@type": "Brand",
      name: product.brand || siteConfig.name
    },
    category: product.category.name,
    description: product.description || product.shortDescription || product.name,
    image: product.images.map((image) => absoluteUrl(image.url)),
    offers: {
      "@type": "Offer",
      url: productUrl(product.slug),
      priceCurrency: "KES",
      price: (product.priceCents / 100).toFixed(2),
      availability: `https://schema.org/${product.stockQuantity > 0 ? "InStock" : "OutOfStock"}`,
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        type="application/ld+json"
      />
      <section className="section">
        <div className="container product-detail">
          <ProductGallery images={product.images} name={product.name} />
          <div className="product-summary">
            <p className="eyebrow">{product.category.name}</p>
            {product.brand ? <p className="product-brand">{product.brand}</p> : null}
            <h1>{product.name}</h1>
            <p className={product.stockQuantity > 0 ? "stock ok" : "stock out"}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} available` : "Out of stock"}
            </p>
            {product.shortDescription ? <p>{product.shortDescription}</p> : null}
            <div className="hero-actions">
              <ProductOptionPurchase action={addSelectedToCartAndRedirectAction.bind(null, product.slug)} disabled={product.stockQuantity <= 0} options={product.options} />
              <form action={addWishlistAction.bind(null, product.slug)}>
                <PendingButton className="secondary-btn" pendingText="Saving...">Wishlist</PendingButton>
              </form>
            </div>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container product-description">
          <h2>Product Details</h2>
          <p>{product.description ?? "Contact Sunspark for specifications, availability, and installation guidance."}</p>
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
      {companions.length ? (
        <section className="section soft-section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Complete your setup</p>
              <h2>Often bought with</h2>
            </div>
            <div className="product-slider" aria-label="Often bought with">
              {companions.map((item) => <ProductCard product={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { addToCartAction } from "@/app/cart/actions";
import { formatMoney } from "@/lib/money";
import { getPrimaryImage } from "@/lib/products/images";

type ProductCardImage = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export type ProductCardProduct = {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  priceCents: number;
  compareAtCents: number | null;
  stockQuantity: number;
  isHotDeal: boolean;
  images: ProductCardImage[];
  category: {
    name: string;
  };
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const image = getPrimaryImage(product.images);

  return (
    <article className="product-card">
      <Link className="product-image" href={`/product/${product.slug}`}>
        {product.images.length > 1 ? (
          <span className="product-image-stack" aria-hidden="true">
            {product.images.map((item, index) => (
              <Image
                alt=""
                fill
                key={item.url}
                sizes="(max-width: 700px) 50vw, 25vw"
                src={item.url}
                style={{ animationDelay: `${index * 2.4}s` }}
              />
            ))}
          </span>
        ) : image ? (
          <Image src={image.url} alt={image.alt ?? product.name} fill sizes="(max-width: 700px) 50vw, 25vw" />
        ) : (
          <span>No image</span>
        )}
        {product.isHotDeal ? <strong className="badge">Hot deal</strong> : null}
      </Link>
      <div className="product-body">
        <p>{product.category.name}</p>
        <h2>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h2>
        <div className="price-row">
          <strong>{formatMoney(product.priceCents)}</strong>
          {product.compareAtCents ? <span>{formatMoney(product.compareAtCents)}</span> : null}
        </div>
        <small>{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}</small>
        <div className="product-actions">
          <Link href={`/product/${product.slug}`}>View</Link>
          <form action={addToCartAction.bind(null, product.slug)}>
            <button disabled={product.stockQuantity <= 0} type="submit">
              Add to cart
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

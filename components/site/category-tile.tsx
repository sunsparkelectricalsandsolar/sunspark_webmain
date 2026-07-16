import Link from "next/link";
import { publicImageUrl } from "@/lib/products/images";

export type CategoryTileCategory = {
  name: string;
  slug: string;
  description: string | null;
  productCount?: number;
  images?: Array<{
    url: string;
    alt: string | null;
    isPrimary: boolean;
  }>;
};

export function CategoryTile({ category }: { category: CategoryTileCategory }) {
  const description = (category.description ?? "Explore Sunspark products").split(/\s+/).filter(Boolean).slice(0, 10).join(" ");
  const productLabel = typeof category.productCount === "number"
    ? `${category.productCount} product${category.productCount === 1 ? "" : "s"}`
    : null;

  return (
    <Link className="category-tile shop-tile" href={`/category/${category.slug}`}>
      {category.images?.length ? (
        <span className={`category-tile-media${category.images.length > 1 ? " is-carousel" : ""}`} aria-hidden="true">
          {category.images.map((image, index) => (
            <img alt="" key={image.url} src={publicImageUrl(image.url)} style={category.images && category.images.length > 1 ? { animationDelay: `${index * 2.4}s` } : undefined} />
          ))}
        </span>
      ) : null}
      <span className="category-tile-copy">
        <strong>{category.name}</strong>
        <small>{description}</small>
        {productLabel ? <em>{productLabel}</em> : null}
      </span>
    </Link>
  );
}

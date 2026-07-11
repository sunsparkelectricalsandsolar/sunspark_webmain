import Link from "next/link";

export type CategoryTileCategory = {
  name: string;
  slug: string;
  description: string | null;
  images?: Array<{
    url: string;
    alt: string | null;
    isPrimary: boolean;
  }>;
};

export function CategoryTile({ category }: { category: CategoryTileCategory }) {
  return (
    <Link className="category-tile shop-tile" href={`/category/${category.slug}`}>
      {category.images?.length ? (
        <span className={`category-tile-media${category.images.length > 1 ? " is-carousel" : ""}`} aria-hidden="true">
          {category.images.map((image, index) => (
            <img alt="" key={image.url} src={image.url} style={category.images && category.images.length > 1 ? { animationDelay: `${index * 2.4}s` } : undefined} />
          ))}
        </span>
      ) : null}
      <span className="category-tile-copy">
        <strong>{category.name}</strong>
        <small>{category.description ?? "Explore Sunspark products"}</small>
      </span>
    </Link>
  );
}

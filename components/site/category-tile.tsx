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
        <span className="category-tile-media" aria-hidden="true">
          {category.images.map((image, index) => (
            <img alt="" key={image.url} src={image.url} style={{ animationDelay: `${index * 2.4}s` }} />
          ))}
        </span>
      ) : null}
      <span>{category.name}</span>
      <small>Shop now</small>
    </Link>
  );
}

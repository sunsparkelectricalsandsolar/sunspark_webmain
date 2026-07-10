import Link from "next/link";

export type CategoryTileCategory = {
  name: string;
  slug: string;
  description: string | null;
};

export function CategoryTile({ category }: { category: CategoryTileCategory }) {
  return (
    <Link className="category-tile shop-tile" href={`/category/${category.slug}`}>
      <span>{category.name}</span>
      <small>Shop now</small>
    </Link>
  );
}

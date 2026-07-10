import Link from "next/link";
import { ProductCard } from "@/components/site/product-card";
import { preventAdminShopping } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getWishlistSlugs } from "@/lib/wishlist/wishlist-service";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  await preventAdminShopping();
  const slugs = await getWishlistSlugs();
  const products = await getProducts(slugs);

  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <h3>Wishlist</h3>
        </div>
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="empty-products">
            <h2>No wishlist items</h2>
            <Link className="primary-btn" href="/store">
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

async function getProducts(slugs: string[]) {
  if (!slugs.length) {
    return [];
  }

  try {
    return prisma.product.findMany({
      where: { slug: { in: slugs }, isActive: true },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }
      }
    });
  } catch {
    return [];
  }
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getProducts();

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-heading row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Products</h1>
          </div>
          <Link className="primary-btn" href="/admin/products/new">
            Add product
          </Link>
        </div>
        <div className="admin-table">
          <div className="admin-table-row heading">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span></span>
          </div>
          {products.map((product) => (
            <div className="admin-table-row" key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.category.name}</span>
              <span>{formatMoney(product.priceCents)}</span>
              <span>{product.stockQuantity}</span>
              <span>{product.isActive ? "Active" : "Hidden"}</span>
              <span className="table-actions">
                <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                <form action={deleteProductAction.bind(null, product.id)}>
                  <button type="submit">Hide</button>
                </form>
              </span>
            </div>
          ))}
          {!products.length ? <p className="empty-state">No products yet. Add the first Sunspark product.</p> : null}
        </div>
      </div>
    </section>
  );
}

async function getProducts() {
  try {
    return prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" }
    });
  } catch {
    return [];
  }
}

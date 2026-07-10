import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { productUrl } from "@/lib/merchant/feed";
import { formatMoney } from "@/lib/money";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const products = await getProducts({
    category: params?.category,
    q: params?.q,
    status: params?.status
  });
  const categories = await getCategories();

  return (
    <AdminLayout
      title="Products"
      subtitle="Manage product pricing, stock, status, and images."
      actions={
        <Link className="primary-btn" href="/admin/products/new">
          Add product
        </Link>
      }
    >
        <form action="/admin/products" className="admin-filter">
          <input name="q" defaultValue={params?.q ?? ""} placeholder="Search product, SKU, description..." />
          <select name="category" defaultValue={params?.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option value={category.slug} key={category.id}>{category.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={params?.status ?? ""}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="low">Low stock</option>
          </select>
          <button type="submit">Filter</button>
        </form>
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
                <a href={productUrl(product.slug)} rel="noreferrer" target="_blank">Merchant</a>
                <form action={deleteProductAction.bind(null, product.id)}>
                  <button type="submit">Hide</button>
                </form>
              </span>
            </div>
          ))}
          {!products.length ? <p className="empty-state">No products yet. Add the first Sunspark product.</p> : null}
        </div>
    </AdminLayout>
  );
}

async function getProducts(input: { q?: string; category?: string; status?: string }) {
  const terms = input.q?.trim().split(/\s+/).filter(Boolean) ?? [];
  try {
    return prisma.product.findMany({
      where: {
        ...(terms.length
          ? {
              AND: terms.map((term) => ({
                OR: [
                  { name: { contains: term } },
                  { sku: { contains: term } },
                  { shortDescription: { contains: term } },
                  { description: { contains: term } },
                  { category: { name: { contains: term } } }
                ]
              }))
            }
          : {}),
        ...(input.category ? { category: { slug: input.category } } : {}),
        ...(input.status === "active" ? { isActive: true } : {}),
        ...(input.status === "hidden" ? { isActive: false } : {}),
        ...(input.status === "low" ? { stockQuantity: { lte: 3 } } : {})
      },
      include: { category: true },
      orderBy: { updatedAt: "desc" }
    });
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    return prisma.category.findMany({ where: { parentId: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  } catch {
    return [];
  }
}
